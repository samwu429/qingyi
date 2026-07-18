"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

// Back-office navigation with active-route highlighting. Exact matching is used
// for the dashboard root so it does not stay highlighted on nested sections.
// 后台导航，高亮当前路由。控制台根路径使用精确匹配，避免在子分区中持续高亮。
const navItems = [
  { label: "概览", href: "/admin", exact: true },
  { label: "主播管理", href: "/admin/streamers" },
  { label: "资讯管理", href: "/admin/posts" },
  { label: "留言管理", href: "/admin/inquiries" },
  { label: "页面内容", href: "/admin/pages" },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "block px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.href, item.exact)
              ? "bg-jade-500 text-white"
              : "text-mist-300 hover:bg-ink-850 hover:text-mist-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
