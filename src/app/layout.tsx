import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

// Root document shell shared by both the public site and the admin panel.
// Locale is set to Simplified Chinese to match the primary audience.
// 公共站点与后台面板共用的根文档骨架，语言设置为简体中文以匹配主要受众。
export const metadata: Metadata = {
  title: {
    default: `${siteConfig.brandName} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.brandName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.brandName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink-950 text-mist-100">
        {children}
      </body>
    </html>
  );
}
