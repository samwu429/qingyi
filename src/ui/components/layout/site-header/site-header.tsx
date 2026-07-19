"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { Container } from "@/ui/components/primitives/container";
import { cn } from "@/lib/ui/cn";

// Public site header: official VI primary lockup, quiet nav, square CTA.
// 公共页头：正式 VI 主标识、克制导航、直角行动按钮。
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-mist-100/10 bg-white/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLogo
          variant="primary"
          priority
          className="h-8 w-auto max-w-[min(220px,46vw)] object-contain object-left sm:h-9 sm:max-w-[260px]"
        />

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
            申请加入
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
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="mt-2 bg-jade-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              申请加入
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
