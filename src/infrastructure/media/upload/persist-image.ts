import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  isCloudinaryConfigured,
  publicMediaConfig,
} from "@/config/env";

// Media upload helpers for the admin panel. Prefer Cloudinary when configured so
// images survive ephemeral hosts; otherwise persist under public/uploads.
// 后台媒体上传辅助：已配置 Cloudinary 时优先使用以保证图片在瞬时主机上持久；
// 否则写入 public/uploads。

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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

async function uploadToLocalDisk(file: File): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type] ?? "bin";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

// Persist an image and return a publicly reachable URL.
// 持久化图片并返回可公开访问的地址。
export async function persistAdminImage(file: File): Promise<string> {
  assertValidImageFile(file);
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file);
  }
  return uploadToLocalDisk(file);
}
