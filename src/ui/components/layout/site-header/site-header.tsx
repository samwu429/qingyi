"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { siteConfig } from "@/config/site.config";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { Container } from "@/ui/components/primitives/container";
import { cn } from "@/lib/ui/cn";

// Public site header: short top nav; Join / Contact sit under About.
// 公共页头：顶栏精简；加入 / 联系收在「关于我们」下。
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutWrapRef = useRef<HTMLDivElement>(null);
  const aboutMenuId = useId();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const aboutItem = siteConfig.primaryNavigation.find(
    (item) => item.children?.length,
  );
  const aboutActive = Boolean(
    aboutItem &&
      (isActive(aboutItem.href) ||
        aboutItem.children?.some((child) => isActive(child.href))),
  );

  useEffect(() => {
    if (!aboutOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!aboutWrapRef.current?.contains(event.target as Node)) {
        setAboutOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aboutOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-mist-100/10 bg-white/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLogo
          variant="primary"
          priority
          className="h-8 w-auto max-w-[min(220px,46vw)] object-contain object-left sm:h-9 sm:max-w-[260px]"
        />

        <nav className="hidden items-center gap-1 md:flex">
          {siteConfig.primaryNavigation.map((item) => {
            if (item.children?.length) {
              return (
                <div
                  key={item.href}
                  ref={aboutWrapRef}
                  className="relative"
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors",
                      aboutActive || aboutOpen
                        ? "bg-ink-850 text-jade-600"
                        : "text-mist-300 hover:text-mist-100",
                    )}
                    aria-expanded={aboutOpen}
                    aria-controls={aboutMenuId}
                    aria-haspopup="menu"
                    onClick={() => setAboutOpen((value) => !value)}
                  >
                    {item.label}
                    <span className="text-[0.65rem] opacity-70" aria-hidden>
                      ▾
                    </span>
                  </button>

                  <div
                    id={aboutMenuId}
                    role="menu"
                    className={cn(
                      "absolute left-0 top-full z-50 min-w-[9.5rem] border border-mist-100/10 bg-white py-1 shadow-[0_12px_28px_-16px_rgba(40,40,40,0.35)]",
                      aboutOpen ? "visible opacity-100" : "invisible opacity-0",
                    )}
                  >
                    <Link
                      href={item.href}
                      role="menuitem"
                      onClick={() => setAboutOpen(false)}
                      className={cn(
                        "block px-4 py-2.5 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-ink-850 text-jade-600"
                          : "text-mist-300 hover:bg-ink-950 hover:text-mist-100",
                      )}
                    >
                      {item.label}
                    </Link>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        onClick={() => setAboutOpen(false)}
                        className={cn(
                          "block px-4 py-2.5 text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-ink-850 text-jade-600"
                            : "text-mist-300 hover:bg-ink-950 hover:text-mist-100",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
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
            );
          })}
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
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-ink-850 text-jade-600"
                      : "text-mist-300",
                  )}
                >
                  {item.label}
                </Link>
                {item.children?.length ? (
                  <div className="mb-1 ml-3 border-l border-mist-100/10 pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block px-4 py-2.5 text-sm",
                          isActive(child.href)
                            ? "bg-ink-850 text-jade-600"
                            : "text-mist-400",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
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
