import { groqConfig } from "@/config/env";

// Thin client for Groq's OpenAI-compatible chat completions API.
// Public site uses streaming text; admin assistant uses non-streaming tool calls
// and optional multimodal (image) content.
// Groq（OpenAI 兼容）对话补全 API 的轻量客户端。
// 前台客服走流式文本；后台助手走非流式工具调用，并可附带多模态图片内容。

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type ChatTextPart = { type: "text"; text: string };
export type ChatImagePart = {
  type: "image_url";
  image_url: { url: string };
};
export type ChatContentPart = ChatTextPart | ChatImagePart;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ChatContentPart[] | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface GroqToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface GroqToolDefinition {
  type: "function";
  function: GroqToolFunction;
}

export interface GroqToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface GroqAssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: GroqToolCall[];
}

export interface GroqCompletionResult {
  message: GroqAssistantMessage;
  finishReason: string | null;
}

export class GroqError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

function assertApiKey(): void {
  if (!groqConfig.apiKey) {
    throw new GroqError("聊天服务未配置（缺少 GROQ_API_KEY）", 503);
  }
}

function mapGroqFailure(status: number, detail: string): GroqError {
  const lower = detail.toLowerCase();
  if (status === 401 || status === 403) {
    return new GroqError(
      "Groq API Key 无效或无权限，请在 Render 环境变量检查 GROQ_API_KEY",
      502,
    );
  }
  if (status === 429) {
    return new GroqError("AI 调用过于频繁，请稍后再试", 429);
  }
  if (
    status === 413 ||
    lower.includes("too large") ||
    lower.includes("20mb") ||
    lower.includes("request too large")
  ) {
    return new GroqError(
      "图片或请求过大。请压缩截图后再传（建议单张 2MB 内），或配置 NEXT_PUBLIC_SITE_URL 以便走外链识图",
      400,
    );
  }
  if (
    lower.includes("model") &&
    (lower.includes("not found") ||
      lower.includes("decommission") ||
      lower.includes("does not exist") ||
      lower.includes("invalid"))
  ) {
    return new GroqError(
      "AI 模型不可用，请检查 GROQ_VISION_MODEL / GROQ_ADMIN_MODEL / GROQ_MODEL",
      502,
    );
  }
  if (lower.includes("tool") && lower.includes("fail")) {
    return new GroqError(
      "当前模型工具调用失败，请稍后重试或更换 GROQ_ADMIN_MODEL",
      502,
    );
  }
  console.error("groq upstream detail", status, detail.slice(0, 800));
  return new GroqError("聊天服务暂时不可用", 502);
}

// Call Groq and return a ReadableStream of decoded assistant text tokens.
// Parses the SSE protocol and forwards only the incremental content deltas.
// 调用 Groq 并返回解码后的助手文本 token 流；解析 SSE 协议，仅转发增量内容。
export async function streamGroqChat(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  assertApiKey();

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqConfig.model,
      messages,
      temperature: 0.6,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    throw mapGroqFailure(upstream.status, detail);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            continue;
          }
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          } catch {
            // Ignore keep-alive/comment lines that are not valid JSON.
            // 忽略非合法 JSON 的保活/注释行。
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

// Non-streaming completion with optional tools and multimodal content.
// Used by the admin operations assistant (tool-calling loop).
// 非流式补全，支持工具与多模态内容；供后台运营助手的工具调用循环使用。
export async function groqChatCompletion(options: {
  messages: ChatMessage[];
  tools?: GroqToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  toolChoice?: "auto" | "none" | "required";
}): Promise<GroqCompletionResult> {
  assertApiKey();

  const body: Record<string, unknown> = {
    model: options.model ?? groqConfig.adminModel,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  };
  if (options.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = options.toolChoice ?? "auto";
  }

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw mapGroqFailure(upstream.status, detail);
  }

  const json = (await upstream.json()) as {
    choices?: {
      finish_reason?: string;
      message?: {
        role?: string;
        content?: string | null;
        tool_calls?: GroqToolCall[];
      };
    }[];
  };

  const choice = json.choices?.[0];
  const message = choice?.message;
  if (!message) {
    throw new GroqError("聊天服务返回为空", 502);
  }

  return {
    message: {
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    },
    finishReason: choice.finish_reason ?? null,
  };
}
