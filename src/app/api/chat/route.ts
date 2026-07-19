import { NextResponse } from "next/server";
import { z } from "zod";
import { isGroqConfigured } from "@/config/env";
import {
  streamGroqChat,
  GroqError,
  type ChatMessage,
} from "@/infrastructure/ai/groq";
import { buildAssistantSystemPrompt } from "@/domain/assistant/assistant.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public chat endpoint powering the on-site assistant. Validates and clamps the
// incoming conversation, prepends a system prompt built from live site content,
// and streams the reply back as plain text tokens.
// 站内助手的公开聊天接口。校验并裁剪传入对话，拼接由实时站点内容生成的系统提示，
// 并以纯文本 token 流式返回回复。
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

export async function POST(request: Request) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "聊天助手暂未开启，请稍后再试或直接联系我们。" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "消息内容不合法" }, { status: 400 });
  }

  // Keep only the most recent turns to bound token usage and latency.
  // 仅保留最近若干轮对话，控制 token 用量与延迟。
  const recent = parsed.data.messages.slice(-12);

  try {
    const system = await buildAssistantSystemPrompt();
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...recent,
    ];

    const stream = await streamGroqChat(messages);
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const status = error instanceof GroqError ? error.status : 500;
    const message =
      error instanceof GroqError
        ? error.message
        : "回复失败，请稍后重试。";
    console.error("chat route failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}
