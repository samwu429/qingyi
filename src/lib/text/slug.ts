// Generate a URL-safe slug from arbitrary text. Latin characters are lowercased
// and hyphenated; non-Latin scripts (including Chinese) are preserved so that
// human-authored slugs remain meaningful, with unsafe URL characters stripped.
// 从任意文本生成 URL 安全的 slug：拉丁字符转小写并以连字符连接；保留包括中文在内的非拉丁字符，
// 使人工撰写的 slug 保持可读，同时移除不安全的 URL 字符。
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Append a short random suffix to keep slugs unique when collisions occur.
// 在发生冲突时追加短随机后缀以保证 slug 唯一。
export function withUniqueSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return slug ? `${slug}-${suffix}` : suffix;
}
