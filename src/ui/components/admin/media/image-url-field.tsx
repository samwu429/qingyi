"use client";

import { useRef, useState, type DragEvent } from "react";
import { Field, TextInput } from "@/ui/components/admin/form/fields";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { cn } from "@/lib/ui/cn";

// Image field with URL entry plus drag-and-drop / local file picking. Uploads go
// through the authenticated admin media API. Supports either a named form field
// (streamer/post forms) or a controlled callback (JSON payload editors).
// 图片字段：支持填写链接，以及拖拽 / 本地选择上传。上传经已认证后台媒体接口。
// 既可用于带 name 的表单字段（主播/文章），也可用于受控回调（JSON 载荷编辑器）。
export function ImageUrlField({
  label,
  name,
  defaultValue = "",
  value: controlledValue,
  onUrlChange,
  hint,
}: {
  label: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onUrlChange?: (url: string) => void;
  hint?: string;
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = (next: string) => {
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    onUrlChange?.(next);
  };

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = name ?? "image-url";

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "upload failed");
      }
      setValue(data.url);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "上传失败，请重试或填写图片链接",
      );
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

  return (
    <Field label={label} htmlFor={fieldId} hint={hint}>
      <div className="space-y-3">
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
          className={cn(
            "border border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-jade-500 bg-jade-500/5"
              : "border-mist-100/20 bg-ink-950",
          )}
        >
          <p className="text-sm text-mist-200">
            {uploading ? "上传中…" : "将图片拖拽到此处，或从本地选择"}
          </p>
          <p className="mt-1 text-xs text-mist-400">
            支持 JPG / PNG / WebP / GIF，最大 5MB；上传后会写入数据库，重新部署也不会丢
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 border border-mist-100/15 bg-white px-4 py-2 text-xs font-medium text-mist-200 transition-colors hover:border-jade-500 disabled:opacity-60"
          >
            选择本地文件
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-2">
            <TextInput
              id={fieldId}
              name={name}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="或直接填写 https:// 图片链接"
            />
            {uploadError ? (
              <p className="text-xs text-red-600">{uploadError}</p>
            ) : null}
          </div>
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-mist-100/10">
            <RemoteImage
              src={value}
              alt="预览"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </Field>
  );
}
