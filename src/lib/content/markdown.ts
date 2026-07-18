import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Convert Markdown source into sanitised HTML for safe rendering. Even though
// authors are authenticated administrators, output is sanitised at this trust
// boundary to neutralise stored XSS via crafted content.
// 将 Markdown 源文本转换为经净化的 HTML 以安全渲染。尽管作者为已认证管理员，
// 仍在此信任边界净化输出，以消除通过构造内容引发的存储型 XSS。
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "strong",
      "em",
      "code",
      "pre",
      "img",
      "br",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}
