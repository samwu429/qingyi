import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { compressImageForVision } from "@/infrastructure/media/upload/compress-for-vision";
import { persistAdminImage } from "@/infrastructure/media/upload/persist-image";
import {
  resolveMediaMime,
  withResolvedMime,
} from "@/infrastructure/media/upload/mime";

// Parse admin-assistant uploads into text excerpts and/or vision image URLs.
// Images prefer a public /api/media URL (smaller Groq payload); base64 is only
// a fallback for tiny files when no public site origin is available.
// 后台助手附件解析：图片优先落库后用公开 /api/media 地址（减小 Groq 载荷）；
// 无站点公网地址时，仅小图才回退 base64。

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Base64 fallback must stay well under Groq's 20MB request ceiling. */
const MAX_BASE64_IMAGE_BYTES = 1_500_000;
const MAX_IMAGES = 4;
const MAX_TEXT_CHARS = 40_000;
const MAX_FILES = 12;

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const TEXT_MIME = new Set([
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
]);

const XLSX_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
]);

const DOCX_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class AttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentError";
  }
}

export interface ParsedAttachment {
  name: string;
  kind: "image" | "text" | "table" | "document";
  mimeType: string;
  /** Public https URL or data URL for Groq vision. */
  imageDataUrl?: string;
  text?: string;
}

function truncate(text: string): string {
  if (text.length <= MAX_TEXT_CHARS) {
    return text;
  }
  return `${text.slice(0, MAX_TEXT_CHARS)}\n\n…(内容过长，已截断)`;
}

function detectKind(
  mime: string,
  name: string,
): "image" | "text" | "table" | "document" | "reject" {
  const lower = name.toLowerCase();
  if (IMAGE_MIME.has(mime)) return "image";
  if (
    TEXT_MIME.has(mime) ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".md")
  ) {
    return lower.endsWith(".csv") || mime === "text/csv" ? "table" : "text";
  }
  if (
    XLSX_MIME.has(mime) ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls")
  ) {
    return "table";
  }
  if (DOCX_MIME.has(mime) || lower.endsWith(".docx")) {
    return "document";
  }
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    return "document";
  }
  return "reject";
}

async function workbookToCsv(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames.slice(0, 5)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(`### 工作表：${sheetName}\n${csv}`);
  }
  return parts.join("\n\n");
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "(空文档)";
}

async function extractPdfHint(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const asLatin = buffer.toString("latin1");
  const strings = asLatin.match(/\((?:\\.|[^\\)]){2,80}\)/g) ?? [];
  const cleaned = strings
    .map((s) =>
      s
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\(.)/g, "$1")
        .trim(),
    )
    .filter((s) => /[\u4e00-\u9fffA-Za-z0-9]/.test(s));
  if (cleaned.length < 3) {
    return "（PDF 未能可靠提取文字。请改传 PNG/JPG 截图或导出 CSV 后再试。）";
  }
  return truncate(cleaned.slice(0, 200).join("\n"));
}

async function resolveImageVisionUrl(
  file: File,
  mime: string,
  publicBaseUrl?: string,
): Promise<string> {
  const compressed = await compressImageForVision(file, mime);
  const normalized = withResolvedMime(compressed.file, compressed.mime);

  // Prefer public media URL so Groq fetches the image (avoids huge base64 JSON).
  // 优先公开媒体地址，让 Groq 自行拉取图片，避免巨型 base64 JSON。
  if (publicBaseUrl) {
    const relative = await persistAdminImage(normalized);
    // Cloudinary already returns an absolute URL; Postgres paths are relative.
    if (/^https?:\/\//i.test(relative)) {
      return relative;
    }
    return `${publicBaseUrl.replace(/\/$/, "")}${relative}`;
  }

  if (normalized.size > MAX_BASE64_IMAGE_BYTES) {
    throw new AttachmentError(
      `图片「${file.name}」较大，且未配置站点公网地址。请在 Render 设置 NEXT_PUBLIC_SITE_URL=https://qingyi.onrender.com，或压缩到约 1.5MB 内再传`,
    );
  }

  const buffer = Buffer.from(await normalized.arrayBuffer());
  return `data:${compressed.mime};base64,${buffer.toString("base64")}`;
}

export async function parseAssistantAttachments(
  files: File[],
  options?: { publicBaseUrl?: string },
): Promise<ParsedAttachment[]> {
  if (files.length > MAX_FILES) {
    throw new AttachmentError(`一次最多上传 ${MAX_FILES} 个文件`);
  }

  const parsed: ParsedAttachment[] = [];
  let imageCount = 0;

  for (const file of files) {
    if (!(file instanceof File) || file.size <= 0) {
      continue;
    }
    if (file.size > MAX_BYTES) {
      throw new AttachmentError(`「${file.name}」超过 25MB 限制`);
    }

    const mime =
      resolveMediaMime(file.type, file.name) ||
      file.type ||
      "application/octet-stream";
    const kind = detectKind(mime, file.name);
    if (kind === "reject") {
      throw new AttachmentError(
        `不支持的文件类型：${file.name}（支持图片、CSV/TXT、Excel、Word、PDF）`,
      );
    }

    if (kind === "image") {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new AttachmentError(
          `图片「${file.name}」过大（限 8MB），请压缩后重试`,
        );
      }
      imageCount += 1;
      if (imageCount > MAX_IMAGES) {
        throw new AttachmentError(`一次最多识别 ${MAX_IMAGES} 张图片`);
      }
      const visionUrl = await resolveImageVisionUrl(
        file,
        mime,
        options?.publicBaseUrl,
      );
      parsed.push({
        name: file.name,
        kind: "image",
        mimeType: mime,
        imageDataUrl: visionUrl,
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (
      kind === "table" &&
      (XLSX_MIME.has(mime) ||
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls"))
    ) {
      text = await workbookToCsv(buffer);
    } else if (
      kind === "document" &&
      (DOCX_MIME.has(mime) || file.name.toLowerCase().endsWith(".docx"))
    ) {
      text = await extractDocx(buffer);
    } else if (
      mime === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      text = await extractPdfHint(file);
    } else {
      text = buffer.toString("utf8");
    }

    parsed.push({
      name: file.name,
      kind,
      mimeType: mime,
      text: truncate(text.trim() || "(空文件)"),
    });
  }

  return parsed;
}

export function attachmentsToPromptBlocks(
  attachments: ParsedAttachment[],
): { textBlock: string; imageUrls: string[] } {
  const textParts: string[] = [];
  const imageUrls: string[] = [];

  attachments.forEach((item, index) => {
    const n = index + 1;
    if (item.kind === "image" && item.imageDataUrl) {
      imageUrls.push(item.imageDataUrl);
      textParts.push(
        `[附件 ${n}] 图片：${item.name}（见下方第 ${imageUrls.length} 张图）`,
      );
    } else {
      textParts.push(
        `[附件 ${n}] ${item.kind === "table" ? "表格" : "文档"}：${item.name}\n\`\`\`\n${item.text ?? ""}\n\`\`\``,
      );
    }
  });

  return {
    textBlock: textParts.length
      ? `用户上传了以下附件：\n\n${textParts.join("\n\n")}`
      : "",
    imageUrls,
  };
}
