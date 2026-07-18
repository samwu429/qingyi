"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";
import { cn } from "@/lib/ui/cn";

// Public site header: brand mark leads, navigation stays quiet, CTA is square.
// 公共页头：品牌标识主导，导航克制，行动按钮为直角。
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-mist-100/10 bg-white/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="返回首页">
          <span className="grid h-9 w-9 place-items-center bg-jade-500 font-display text-lg font-bold text-white">
            青
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold text-mist-100">
              {siteConfig.brandName}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-mist-400">
              {siteConfig.brandNameEn}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {siteConfig.primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-ink-850 text-jade-600"
                  : "text-mist-300 hover:text-mist-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/join"
            className="bg-jade-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
          >
            立即签约
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center border border-mist-100/15 text-mist-200 md:hidden"
          aria-expanded={open}
          aria-label="切换导航菜单"
        >
          <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
        </button>
      </Container>

      {open ? (
        <div className="border-t border-mist-100/10 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {siteConfig.primaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-ink-850 text-jade-600"
                    : "text-mist-300",
                )}
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
