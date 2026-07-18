"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site.config";

// Hero visual plane. Falls back to the crafted stage art when the configured
// photo URL is missing or fails to load (legacy wiped /uploads paths).
// 首屏视觉平面：配置的图片地址缺失或加载失败时（含历史失效的 /uploads 路径）
// 回退到精心构图的舞台视觉。
export function HeroMedia({ imageUrl }: { imageUrl: string }) {
  const trimmed = imageUrl.trim();
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(trimmed) && !failed;

  return (
    <div className="hero-stage__media" aria-hidden={!showPhoto}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt=""
          className="hero-stage__photo"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="hero-stage__art">
          <span className="hero-stage__glyph">青</span>
          <span className="hero-stage__mark">{siteConfig.brandNameEn}</span>
          <div className="hero-stage__bars" />
        </div>
      )}
    </div>
  );
}
