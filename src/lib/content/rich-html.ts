import DOMPurify from "isomorphic-dompurify";

// Sanitise free-form HTML/CSS authored by administrators for the "HTML" article
// format. This is a wider allowlist than the Markdown renderer: it keeps inline
// styles, <style> blocks, classes, inline SVG, media embeds, and PDF/video
// iframes so authors can ship rich layouts, long illustrations, and embedded
// documents. Output is still sanitised at this trust boundary to neutralise
// script-based stored XSS.
// 净化管理员撰写的自由 HTML/CSS（用于「HTML」文章格式）。相比 Markdown 渲染器放开更多：
// 保留内联样式、<style> 块、class、内联 SVG、媒体与 PDF/视频 iframe，便于富排版、长图与文档嵌入。
// 仍在此信任边界净化输出，消除基于脚本的存储型 XSS。
export function renderRichHtml(source: string): string {
  return DOMPurify.sanitize(source, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_TAGS: [
      "style",
      "iframe",
      "figure",
      "figcaption",
      "video",
      "audio",
      "source",
      "track",
      "picture",
      "details",
      "summary",
    ],
    ADD_ATTR: [
      "style",
      "class",
      "id",
      "target",
      "rel",
      "loading",
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "width",
      "height",
      "type",
      "controls",
      "muted",
      "autoplay",
      "loop",
      "playsinline",
      "poster",
      "preload",
      "srcset",
      "sizes",
      "colspan",
      "rowspan",
      "align",
      "start",
      "open",
    ],
    ALLOW_DATA_ATTR: true,
    ADD_URI_SAFE_ATTR: ["poster"],
  });
}
