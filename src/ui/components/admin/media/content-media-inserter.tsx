"use client";

import { useRef, useState, type DragEvent } from "react";

type UploadedKind = "image" | "svg" | "pdf";

// Upload helper for article bodies. Accepts images, SVG, and PDF, uploads via the
// authenticated media API, then offers ready-to-paste snippets tailored to the
// current authoring format (Markdown vs HTML). This is how authors embed long
// images, SVG illustrations, and PDF documents into 资讯 articles.
// 文章正文的上传助手：支持图片、SVG、PDF，经已认证媒体接口上传后，按当前撰写格式
//（Markdown / HTML）给出可直接粘贴的代码片段，用于在资讯文章中嵌入长图、SVG 与 PDF。
export function ContentMediaInserter({ format }: { format: "MARKDOWN" | "HTML" }) {
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<UploadedKind>("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectKind = (type: string): UploadedKind => {
    if (type === "application/pdf") return "pdf";
    if (type === "image/svg+xml") return "svg";
    return "image";
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setCopied(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "上传失败");
      }
      setUrl(data.url);
      setKind(detectKind(file.type));
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

  const snippets = buildSnippets(format, kind, url);

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
        上传后复制下方代码，粘贴到正文即可。长图、SVG 插画、PDF 文档均支持（最大 25MB）。
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
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
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

      {url ? (
        <div className="mt-3 space-y-2">
          {snippets.map((snippet) => (
            <div key={snippet.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-mist-300">
                  {snippet.label}
                </span>
                <button
                  type="button"
                  onClick={() => copy(snippet.label, snippet.code)}
                  className="text-xs text-jade-500 hover:underline"
                >
                  {copied === snippet.label ? "已复制 ✓" : "复制"}
                </button>
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
        { label: "下载链接", code: `<a href="${url}" target="_blank">下载 PDF</a>` },
      ];
    }
    return [
      { label: "PDF 链接（Markdown）", code: `[下载 PDF](${url})` },
      {
        label: "提示",
        code: "PDF 内嵌需将正文格式切换为 HTML；Markdown 下仅支持链接。",
      },
    ];
  }

  // Images and SVG behave the same for embedding purposes.
  // 图片与 SVG 的嵌入方式相同。
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
