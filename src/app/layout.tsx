import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

// Display serif for brand/headlines; sans for body copy. Loaded via next/font so
// the public site never falls back to a generic system stack as primary type.
// 品牌与标题用衬线展示字体，正文用无衬线；经 next/font 加载，避免以系统默认字体为主。
const displayFont = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

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
    <html
      lang="zh-CN"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-950 text-mist-100">
        {children}
      </body>
    </html>
  );
}
