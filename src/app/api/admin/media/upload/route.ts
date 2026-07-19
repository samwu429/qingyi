import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import {
  MediaUploadError,
  persistAdminImage,
} from "@/infrastructure/media/upload/persist-image";
import {
  resolveMediaMime,
  withResolvedMime,
} from "@/infrastructure/media/upload/mime";

export const runtime = "nodejs";
export const maxDuration = 60;

// Authenticated media upload endpoint used by admin drag-and-drop widgets.
// Accepts File or Blob parts and recovers MIME from the filename when needed.
// 供后台拖拽上传组件调用的已认证媒体接口；兼容 File/Blob，并在缺 MIME 时按扩展名补全。
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    if (!(entry instanceof Blob) || entry.size <= 0) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    const filename =
      entry instanceof File && entry.name
        ? entry.name
        : String(formData.get("filename") ?? "upload.bin");
    const mime = resolveMediaMime(entry.type, filename);
    if (!mime) {
      return NextResponse.json(
        { error: "仅支持 JPG / PNG / WebP / GIF / SVG 图片或 PDF 文件" },
        { status: 400 },
      );
    }

    const file =
      entry instanceof File
        ? withResolvedMime(entry, mime)
        : new File([entry], filename, { type: mime });

    const url = await persistAdminImage(file);
    return NextResponse.json({ url, mimeType: mime });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("media upload failed", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
