import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import {
  ocrImageToText,
  warmOcrWorker,
} from "@/infrastructure/media/upload/ocr-image";
import { resolveMediaMime } from "@/infrastructure/media/upload/mime";

export const runtime = "nodejs";
export const maxDuration = 120;

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Warm OCR worker (language data) so the first screenshot is faster.
// 预热 OCR worker（语言包），让第一张截图更快。
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    await warmOcrWorker();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ocr warm failed", error);
    return NextResponse.json({ error: "OCR 预热失败" }, { status: 500 });
  }
}

// OCR one screenshot early (while the admin is still typing the prompt).
// 选中截图后立刻识别，管理员打字时可并行完成 OCR。
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "请上传一张图片" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `图片过大（限 8MB）` },
        { status: 400 },
      );
    }

    const mime =
      resolveMediaMime(file.type, file.name) ||
      file.type ||
      "application/octet-stream";
    if (!IMAGE_MIME.has(mime)) {
      return NextResponse.json({ error: "仅支持图片 OCR" }, { status: 400 });
    }

    const text = await ocrImageToText(file);
    if (text.replace(/\s+/g, "").length < 4) {
      return NextResponse.json(
        {
          error:
            "未能识别出文字。请换更清晰的截图，或直接粘贴数字/上传 Excel、CSV",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      name: file.name,
      text,
      mimeType: mime,
    });
  } catch (error) {
    console.error("ocr failed", error);
    return NextResponse.json(
      { error: "文字识别失败，请稍后重试" },
      { status: 500 },
    );
  }
}
