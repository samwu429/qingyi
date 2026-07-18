import Link from "next/link";
import type { ReactNode } from "react";

// Consistent header for admin content pages with a title, optional description,
// and an optional primary action link.
// 后台内容页统一头部：标题、可选描述与可选主操作链接。
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-mist-100">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-mist-400">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-lg bg-jade-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-jade-400"
        >
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-block text-sm text-mist-400 transition-colors hover:text-jade-300"
    >
      {children}
    </Link>
  );
}
