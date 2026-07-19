// Resolve a reliable MIME type for admin uploads. Browsers (especially on
// Windows) often send an empty type or application/octet-stream for SVG/PDF.
// 解析后台上传的可靠 MIME：浏览器（尤其 Windows）常把 SVG/PDF 的 type 留空或标成 octet-stream。

const EXTENSION_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const ALLOWED = new Set(Object.values(EXTENSION_MIME));

export function extensionOf(filename: string): string {
  const lower = filename.trim().toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return "";
  return lower.slice(dot);
}

export function resolveMediaMime(
  declaredType: string | undefined | null,
  filename: string,
): string | null {
  const declared = (declaredType ?? "").trim().toLowerCase();
  if (ALLOWED.has(declared)) {
    return declared;
  }

  const fromName = EXTENSION_MIME[extensionOf(filename)];
  if (fromName) {
    return fromName;
  }

  return null;
}

export function withResolvedMime(file: File, mime: string): File {
  if (file.type === mime) {
    return file;
  }
  return new File([file], file.name || `upload${extensionOf(file.name) || ""}`, {
    type: mime,
    lastModified: file.lastModified,
  });
}
