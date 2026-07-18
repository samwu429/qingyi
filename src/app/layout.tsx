import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

// Typography relies on native Chinese system faces rather than Google Noto
// packs, which read as generic AI-landing templates. Songti carries titles;
// PingFang / YaHei carry body copy with a local editorial feel.
// 字体采用系统中文字体，避免 Google Noto 套装带来的模板感。标题用宋体，
// 正文用苹方 / 微软雅黑，更接近本土媒体站气质。

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://qingyi.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.brandName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.brandName,
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-ink-950 text-mist-100">
        {children}
      </body>
    </html>
  );
}
