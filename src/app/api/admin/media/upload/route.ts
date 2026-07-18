import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import {
  MediaUploadError,
  persistAdminImage,
} from "@/infrastructure/media/upload/persist-image";

export const runtime = "nodejs";

// Authenticated image upload endpoint used by the admin drag-and-drop widget.
// 供后台拖拽上传组件调用的已认证图片上传接口。
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    const url = await persistAdminImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("media upload failed", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
