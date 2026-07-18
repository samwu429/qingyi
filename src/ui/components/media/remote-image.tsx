"use client";

import { useState } from "react";
import { cn } from "@/lib/ui/cn";

// Render an administrator-supplied image URL, falling back to a branded
// placeholder when the source is missing or fails to load (e.g. wiped Render
// disk paths from older uploads).
// 渲染管理员提供的图片地址；缺失或加载失败时（例如旧版 Render 磁盘路径被清空）
// 回退到品牌占位符。
export function RemoteImage({
  src,
  alt,
  className,
  fallbackLabel = "青意",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  // Key failure state to the current src so a replaced URL can retry loading.
  // 将失败状态与当前 src 绑定，更换地址后可重新尝试加载。
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  if (showFallback) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-ink-850 via-white to-jade-500/15 font-display text-2xl font-bold text-jade-500/35",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
