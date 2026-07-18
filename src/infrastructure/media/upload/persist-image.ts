import {
  isCloudinaryConfigured,
  publicMediaConfig,
} from "@/config/env";
import { prisma } from "@/infrastructure/database/prisma/client";

// Media upload helpers for the admin panel. Prefer Cloudinary when configured;
// otherwise store bytes in Postgres and expose them via /api/media/:id so images
// survive Render redeploys (local public/uploads would be wiped).
// 后台媒体上传辅助：已配置 Cloudinary 时优先使用；否则把字节写入 Postgres，
// 并通过 /api/media/:id 对外提供，避免 Render 重新部署清空本地 public/uploads。

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export function assertValidImageFile(file: File): void {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new MediaUploadError("仅支持 JPG、PNG、WebP 或 GIF 图片");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new MediaUploadError("图片大小需在 5MB 以内");
  }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", publicMediaConfig.cloudinaryUploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${publicMediaConfig.cloudinaryCloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new MediaUploadError("云端上传失败，请稍后重试");
  }
  const data = (await response.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new MediaUploadError("云端未返回图片地址");
  }
  return data.secure_url;
}

async function uploadToDatabase(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await prisma.mediaAsset.create({
    data: {
      mimeType: file.type,
      byteSize: buffer.byteLength,
      data: buffer,
    },
    select: { id: true },
  });
  return `/api/media/${asset.id}`;
}

// Persist an image and return a publicly reachable URL.
// 持久化图片并返回可公开访问的地址。
export async function persistAdminImage(file: File): Promise<string> {
  assertValidImageFile(file);
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file);
  }
  return uploadToDatabase(file);
}
