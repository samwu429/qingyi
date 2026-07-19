"use client";

import { useRef, useState, type DragEvent } from "react";
import { RemoteImage } from "@/ui/components/media/remote-image";

type UploadedKind = "image" | "svg" | "pdf";

// Upload helper for rich bodies (blog posts + streamer bios). Accepts images,
// SVG, and PDF, uploads via the authenticated media API, then inserts a snippet
// into the target textarea and offers copyable fallbacks.
// 资讯正文与主播简介共用的上传助手：上传后直接插入目标文本框，并提供可复制片段。
export function ContentMediaInserter({
  format,
  targetFieldId = "content",
}: {
  format: "MARKDOWN" | "HTML";
  targetFieldId?: string;
}) {
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<UploadedKind>("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [inserted, setInserted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectKind = (type: string, name: string): UploadedKind => {
    const lower = `${type} ${name}`.toLowerCase();
    if (lower.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
    if (lower.includes("svg") || lower.endsWith(".svg")) return "svg";
    return "image";
  };

  const insertIntoTarget = (snippet: string) => {
    const el = document.getElementById(targetFieldId);
    if (!(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLInputElement)) {
      return false;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const spacerBefore = before && !before.endsWith("\n") ? "\n\n" : "";
    const spacerAfter = after && !after.startsWith("\n") ? "\n\n" : "";
    const next = `${before}${spacerBefore}${snippet}${spacerAfter}${after}`;
    el.value = next;
    const caret = (before + spacerBefore + snippet).length;
    el.setSelectionRange(caret, caret);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    return true;
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setCopied(null);
    setInserted(false);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("filename", file.name);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const raw = await response.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(raw) as { url?: string; error?: string };
      } catch {
        throw new Error(
          response.ok ? "上传响应异常" : `上传失败（${response.status}）`,
        );
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "上传失败");
      }

      const nextKind = detectKind(file.type, file.name);
      setUrl(data.url);
      setKind(nextKind);

      const primary = buildSnippets(format, nextKind, data.url)[0];
      if (primary && insertIntoTarget(primary.code)) {
        setInserted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const snippets = url ? buildSnippets(format, kind, url) : [];

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("复制失败，请手动选择文本复制");
    }
  };

  return (
    <div className="border border-mist-100/10 bg-ink-950/[0.02] p-4">
      <p className="text-sm font-medium text-mist-200">插入图片 / SVG / PDF</p>
      <p className="mt-1 text-xs text-mist-400">
        上传成功后会自动插入正文；也可再复制下方代码。长图、SVG、PDF 均支持（最大 25MB）。
      </p>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={`mt-3 border border-dashed px-4 py-6 text-center transition-colors ${
          dragging
            ? "border-jade-500 bg-jade-500/5"
            : "border-mist-100/20 bg-ink-950"
        }`}
      >
        <p className="text-sm text-mist-200">
          {uploading ? "上传中…" : "将文件拖拽到此处，或从本地选择"}
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 border border-mist-100/15 bg-white px-4 py-2 text-xs font-medium text-mist-200 transition-colors hover:border-jade-500 disabled:opacity-60"
        >
          选择本地文件
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.svg,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {inserted ? (
        <p className="mt-2 text-xs text-jade-600">已插入正文，保存后即可在前台看到。</p>
      ) : null}

      {url && kind === "pdf" && format === "MARKDOWN" ? (
        <p className="mt-2 text-xs text-mist-400">
          Markdown 下 PDF 以链接插入；若要页面内嵌预览，请把正文格式改为 HTML 后再上传。
        </p>
      ) : null}

      {url ? (
        <div className="mt-3 space-y-3">
          {kind === "pdf" ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-jade-500 hover:underline"
            >
              预览 PDF →
            </a>
          ) : (
            <div className="overflow-hidden border border-mist-100/10 bg-white">
              <RemoteImage
                src={url}
                alt="上传预览"
                className="max-h-48 w-full object-contain"
              />
            </div>
          )}

          {snippets.map((snippet) => (
            <div key={snippet.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-mist-300">
                  {snippet.label}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (insertIntoTarget(snippet.code)) {
                        setInserted(true);
                      }
                    }}
                    className="text-xs text-jade-500 hover:underline"
                  >
                    再次插入
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(snippet.label, snippet.code)}
                    className="text-xs text-jade-500 hover:underline"
                  >
                    {copied === snippet.label ? "已复制 ✓" : "复制"}
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={snippet.code}
                onFocus={(event) => event.currentTarget.select()}
                className="w-full resize-none border border-mist-100/15 bg-white px-3 py-2 font-mono text-xs text-mist-100"
                rows={snippet.code.length > 80 ? 3 : 1}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildSnippets(
  format: "MARKDOWN" | "HTML",
  kind: UploadedKind,
  url: string,
): { label: string; code: string }[] {
  if (kind === "pdf") {
    if (format === "HTML") {
      return [
        {
          label: "PDF 嵌入（HTML）",
          code: `<iframe src="${url}" data-pdf style="width:100%;height:85vh;border:0"></iframe>`,
        },
        { label: "下载链接", code: `<a href="${url}" target="_blank" rel="noopener noreferrer">下载 PDF</a>` },
      ];
    }
    return [{ label: "PDF 链接（Markdown）", code: `[下载 PDF](${url})` }];
  }

  if (format === "HTML") {
    return [
      {
        label: "图片 / SVG（HTML）",
        code: `<img src="${url}" alt="" style="width:100%;height:auto" />`,
      },
    ];
  }
  return [{ label: "图片 / SVG（Markdown）", code: `![](${url})` }];
}
