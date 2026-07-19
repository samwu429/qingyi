import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import { isGroqConfigured } from "@/config/env";
import { GroqError } from "@/infrastructure/ai/groq";
import {
  AttachmentError,
  parseAssistantAttachments,
  type PrecomputedOcrAttachment,
} from "@/domain/admin-assistant/attachments";
import {
  runAdminAssistant,
  type AdminChatTurn,
} from "@/domain/admin-assistant/admin-assistant.service";

export const runtime = "nodejs";
export const maxDuration = 120;

// Authenticated admin operations assistant. Accepts chat history + multi-file
// uploads, runs a tool-calling loop against domain services, and returns a
// reply plus an audit trail of executed actions.
// 已认证的后台运营助手：接收对话历史与多文件上传，对 domain 服务跑工具调用循环，
// 返回回复与已执行操作的审计列表。

function parseHistory(raw: FormDataEntryValue | null): AdminChatTurn[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item): item is AdminChatTurn =>
          typeof item === "object" &&
          item !== null &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string",
      )
      .slice(-8);
  } catch {
    return [];
  }
}

function resolvePublicBaseUrl(request: Request): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  const origin = request.headers.get("origin")?.trim().replace(/\/$/, "");
  if (origin && /^https?:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) {
    return origin;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
    return `${proto}://${host}`;
  }
  return undefined;
}

function parsePrecomputedOcr(
  raw: FormDataEntryValue | null,
): PrecomputedOcrAttachment[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item): item is PrecomputedOcrAttachment =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as PrecomputedOcrAttachment).name === "string" &&
          typeof (item as PrecomputedOcrAttachment).text === "string",
      )
      .slice(0, 4);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "未配置 GROQ_API_KEY，后台 AI 不可用" },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const messageRaw = formData.get("message");
    const message = typeof messageRaw === "string" ? messageRaw : "";
    const history = parseHistory(formData.get("history"));

    const precomputedOcr = parsePrecomputedOcr(formData.get("ocrAttachments"));
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!message.trim() && files.length === 0 && precomputedOcr.length === 0) {
      return NextResponse.json(
        { error: "请输入说明或上传至少一个文件" },
        { status: 400 },
      );
    }

    const publicBaseUrl = resolvePublicBaseUrl(request);
    const attachments = await parseAssistantAttachments(files, {
      publicBaseUrl,
      precomputedOcr,
    });
    const result = await runAdminAssistant({
      message: message.trim() || "请根据附件处理后台数据。",
      history,
      attachments,
    });

    return NextResponse.json({
      reply: result.reply,
      actions: result.actions,
    });
  } catch (error) {
    if (error instanceof AttachmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof GroqError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("admin assistant failed", error);
    return NextResponse.json(
      { error: "助手暂时不可用，请稍后重试" },
      { status: 500 },
    );
  }
}
