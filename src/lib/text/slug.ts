// URL slug helpers. Slugs stay ASCII-only so dynamic routes remain reliable
// across proxies and Next.js path matching; non-Latin input is stripped and
// Latin letters are lowercased and hyphenated.
// URL slug 工具。仅保留 ASCII，避免中文等非拉丁字符在代理与 Next.js 路径匹配中
// 触发编码不一致导致 404；非拉丁输入会被剥离，拉丁字母转小写并以连字符连接。

const NON_ASCII = /[^\x00-\x7F]/;

// True when the value still contains characters outside the ASCII range.
// 当值仍包含 ASCII 以外的字符时返回 true。
export function hasNonAscii(value: string): boolean {
  return NON_ASCII.test(value);
}

// Decode a route param that may arrive percent-encoded (once or twice) from
// the browser or an upstream proxy. Already-decoded Unicode is left intact.
// 解码可能被浏览器或上游代理百分号编码（一次或两次）的路由参数；
// 已解码的 Unicode 保持不变。
export function normalizeSlugParam(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) {
        break;
      }
      value = decoded;
    } catch {
      break;
    }
  }
  return value;
}

// Generate a URL-safe ASCII slug from arbitrary text.
// 从任意文本生成 URL 安全的 ASCII slug。
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Append a short random suffix to keep slugs unique when collisions occur.
// 在发生冲突时追加短随机后缀以保证 slug 唯一。
export function withUniqueSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return slug ? `${slug}-${suffix}` : suffix;
}
