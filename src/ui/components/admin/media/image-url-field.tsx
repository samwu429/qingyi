"use client";

import { useState } from "react";
import { Field, TextInput } from "@/ui/components/admin/form/fields";
import { RemoteImage } from "@/ui/components/media/remote-image";
import {
  publicMediaConfig,
  isCloudinaryConfigured,
} from "@/config/env";

// Image field accepting a direct URL, with an optional unsigned Cloudinary upload
// when the corresponding public environment references are configured. When they
// are absent the field degrades to manual URL entry.
// 图片字段：支持直接填写地址；当配置了对应公开环境引用时提供 Cloudinary 无签名上传，
// 否则优雅回退为手动填写地址。
export function ImageUrlField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadEnabled = isCloudinaryConfigured();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", publicMediaConfig.cloudinaryUploadPreset);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${publicMediaConfig.cloudinaryCloudName}/image/upload`,
        { method: "POST", body },
      );
      if (!response.ok) {
        throw new Error("upload failed");
      }
      const data = (await response.json()) as { secure_url?: string };
      if (data.secure_url) {
        setValue(data.secure_url);
      } else {
        throw new Error("missing url");
      }
    } catch {
      setUploadError("上传失败，请重试或直接填写图片地址");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label} htmlFor={name}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-2">
          <TextInput
            id={name}
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https:// 图片地址"
          />
          {uploadEnabled ? (
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-mist-300/15 px-4 py-2 text-xs text-mist-200 hover:border-jade-400">
                {uploading ? "上传中…" : "上传图片"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUpload(file);
                    }
                  }}
                />
              </label>
              {uploadError ? (
                <span className="text-xs text-red-300">{uploadError}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-mist-300/10">
          <RemoteImage
            src={value}
            alt="预览"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </Field>
  );
}
