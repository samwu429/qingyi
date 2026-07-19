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
    return new GroqError(
      "Groq 额度限流（免费档每分钟次数有限）。请等待约 30–60 秒后再发一次；勿连续连点发送",
      429,
    );
  }
  if (
    status === 413 ||
    lower.includes("too large") ||
    lower.includes("20mb") ||
    lower.includes("request too large")
  ) {
    return new GroqError(
      "图片或请求仍过大。请只传 1 张清晰截图（或裁掉无关区域）后重试；并确认 Render 已设置 NEXT_PUBLIC_SITE_URL=https://qingyi.onrender.com",
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

const GROQ_FETCH_TIMEOUT_MS = 20_000;

function isGptOssModel(model: string): boolean {
  return model.includes("gpt-oss");
}

// Call Groq and return a ReadableStream of decoded assistant text tokens.
// Parses the SSE protocol and forwards only the incremental content deltas.
// 调用 Groq 并返回解码后的助手文本 token 流；解析 SSE 协议，仅转发增量内容。
export async function streamGroqChat(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  assertApiKey();

  const model = groqConfig.model;
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.6,
    max_tokens: 1024,
    stream: true,
  };
  // Reasoning models may burn the whole budget on hidden thought and never
  // emit content — keep public chat snappy when someone still points GROQ_MODEL
  // at gpt-oss-*.
  // 推理模型可能把额度耗在思考上迟迟不出正文；若仍指向 gpt-oss 则压低推理。
  if (isGptOssModel(model)) {
    body.include_reasoning = false;
    body.reasoning_effort = "low";
  }

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GROQ_FETCH_TIMEOUT_MS),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new GroqError(
        "AI 响应超时。请在 Render 把 GROQ_MODEL 设为 llama-3.1-8b-instant 后重试",
        504,
      );
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new GroqError("AI 请求已中断，请重试", 504);
    }
    throw error;
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
    async start(controller) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
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
                choices?: {
                  delta?: { content?: string | null };
                  message?: { content?: string | null };
                }[];
              };
              const token =
                json.choices?.[0]?.delta?.content ??
                json.choices?.[0]?.message?.content;
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            } catch {
              // Ignore keep-alive/comment lines that are not valid JSON.
              // 忽略非合法 JSON 的保活/注释行。
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(header: string | null, attempt: number): number {
  if (header) {
    const asInt = Number(header);
    if (Number.isFinite(asInt) && asInt >= 0) {
      return Math.min(Math.max(asInt * 1000, 1000), 60_000);
    }
    const when = Date.parse(header);
    if (!Number.isNaN(when)) {
      return Math.min(Math.max(when - Date.now(), 1000), 60_000);
    }
  }
  // 2s, 5s, 12s
  return [2000, 5000, 12_000][attempt] ?? 12_000;
}

async function groqChatCompletionOnce(options: {
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
    signal: AbortSignal.timeout(GROQ_FETCH_TIMEOUT_MS),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new GroqError("AI 响应超时，请稍后重试", 504);
    }
    throw error;
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    const error = mapGroqFailure(upstream.status, detail);
    if (upstream.status === 429) {
      (error as GroqError & { retryAfterMs?: number }).retryAfterMs =
        parseRetryAfterMs(upstream.headers.get("retry-after"), 0);
    }
    throw error;
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

// Non-streaming completion with optional tools and multimodal content.
// Retries on HTTP 429 so a single admin upload is less likely to fail on free tier.
// 非流式补全，支持工具与多模态；遇 429 自动退避重试，降低免费档限流失败率。
export async function groqChatCompletion(options: {
  messages: ChatMessage[];
  tools?: GroqToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  toolChoice?: "auto" | "none" | "required";
}): Promise<GroqCompletionResult> {
  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await groqChatCompletionOnce(options);
    } catch (error) {
      lastError = error;
      if (
        error instanceof GroqError &&
        error.status === 429 &&
        attempt < maxAttempts - 1
      ) {
        const retryAfterMs =
          (error as GroqError & { retryAfterMs?: number }).retryAfterMs ??
          parseRetryAfterMs(null, attempt);
        console.warn(
          `groq rate limited, retrying in ${retryAfterMs}ms (attempt ${attempt + 1})`,
        );
        await sleep(retryAfterMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new GroqError("聊天服务暂时不可用", 502);
}
