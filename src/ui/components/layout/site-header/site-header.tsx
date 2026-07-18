"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";
import { cn } from "@/lib/ui/cn";

// Public site header with brand mark and responsive navigation. The active route
// is highlighted, and a collapsible menu serves small screens.
// 公共站点页头：包含品牌标识与响应式导航。高亮当前路由，并为小屏提供可折叠菜单。
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-mist-300/10 bg-ink-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="返回首页">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-jade-500 text-lg font-black text-ink-950">
            青
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-mist-100">
              {siteConfig.brandName}
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-mist-400">
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
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-ink-800 text-jade-300"
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
            className="rounded-full bg-jade-500 px-5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-jade-400"
          >
            立即签约
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-mist-300/15 text-mist-200 md:hidden"
          aria-expanded={open}
          aria-label="切换导航菜单"
        >
          <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
        </button>
      </Container>

      {open ? (
        <div className="border-t border-mist-300/10 bg-ink-900 md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {siteConfig.primaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-3 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-ink-800 text-jade-300"
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
