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

// Raster images go through Cloudinary when configured; everything else (SVG /
// PDF, and images when Cloudinary is off) is stored in Postgres and served from
// /api/media/:id. SVG and PDF are treated as documents so they can be embedded
// in 资讯 articles (SVG illustrations, long screenshots, PDF reports).
// 位图在配置了 Cloudinary 时走云端；其余（SVG / PDF，以及未配置 Cloudinary 时的图片）
// 存入 Postgres，通过 /api/media/:id 提供，可在资讯文章中嵌入。
const RASTER_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOCUMENT_MIME = new Set(["image/svg+xml", "application/pdf"]);

const MAX_BYTES = 25 * 1024 * 1024;

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

function isAllowedMime(type: string): boolean {
  return RASTER_IMAGE_MIME.has(type) || DOCUMENT_MIME.has(type);
}

export function assertValidMediaFile(file: File): void {
  if (!isAllowedMime(file.type)) {
    throw new MediaUploadError(
      "仅支持 JPG / PNG / WebP / GIF / SVG 图片或 PDF 文件",
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new MediaUploadError("文件大小需在 25MB 以内");
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

// Persist an uploaded file and return a publicly reachable URL. SVG and PDF are
// always stored in Postgres (served with hardened headers); raster images use
// Cloudinary when configured, otherwise Postgres.
// 持久化上传文件并返回可公开访问地址。SVG 与 PDF 一律存入 Postgres（以加固响应头提供）；
// 位图在配置了 Cloudinary 时走云端，否则存入 Postgres。
export async function persistAdminImage(file: File): Promise<string> {
  assertValidMediaFile(file);
  if (RASTER_IMAGE_MIME.has(file.type) && isCloudinaryConfigured()) {
    return uploadToCloudinary(file);
  }
  return uploadToDatabase(file);
}
