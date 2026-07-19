import { groqConfig } from "@/config/env";

// Thin client for Groq's OpenAI-compatible chat completions API. We stream the
// response so the on-site assistant feels responsive, and expose a small typed
// surface so route handlers stay declarative.
// Groq（OpenAI 兼容）对话补全 API 的轻量客户端。以流式返回，使站内助手响应更即时；
// 对外暴露精简的类型接口，让路由处理器保持声明式。

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class GroqError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

// Call Groq and return a ReadableStream of decoded assistant text tokens.
// Parses the SSE protocol and forwards only the incremental content deltas.
// 调用 Groq 并返回解码后的助手文本 token 流；解析 SSE 协议，仅转发增量内容。
export async function streamGroqChat(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  if (!groqConfig.apiKey) {
    throw new GroqError("聊天服务未配置", 503);
  }

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
    console.error("groq request failed", upstream.status, detail);
    throw new GroqError("聊天服务暂时不可用", 502);
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
