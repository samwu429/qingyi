import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export const runtime = "nodejs";

// Public media delivery for images stored in Postgres. Cache-friendly so repeat
// views of streamer cards do not re-hit the database on every navigation.
// 对外提供存于 Postgres 的图片；带缓存头，避免主播卡片每次导航都打库。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || id.length > 64) {
    return new NextResponse("Not found", { status: 404 });
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { mimeType: true, data: true },
  });
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": asset.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  // SVG can carry inline scripts; serve it locked down so it renders as a static
  // image even if opened directly. PDF is served inline so it can be embedded.
  // SVG 可能内嵌脚本，直接打开时以沙箱化响应头提供，确保仅作为静态图片渲染；
  // PDF 以内联方式提供，便于在文章中嵌入。
  if (asset.mimeType === "image/svg+xml") {
    headers["Content-Security-Policy"] =
      "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  } else if (asset.mimeType === "application/pdf") {
    headers["Content-Disposition"] = "inline";
  }

  return new NextResponse(new Uint8Array(asset.data), {
    status: 200,
    headers,
  });
}
