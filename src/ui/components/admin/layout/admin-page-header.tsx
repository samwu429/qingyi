import Link from "next/link";
import type { ReactNode } from "react";

// Consistent header for admin content pages with a title, optional description,
// and an optional primary action link.
// ??????????????????????????
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
        <h1 className="font-display text-2xl font-bold text-mist-100">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-mist-400">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="bg-jade-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
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
      className="mb-6 inline-block text-sm text-mist-400 transition-colors hover:text-jade-500"
    >
      {children}
    </Link>
  );
}
