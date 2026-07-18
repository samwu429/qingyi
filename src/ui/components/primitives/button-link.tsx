import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Styled navigational button rendered as a link. Variants keep call-to-action
// styling consistent across pages.
// 以链接呈现的样式化按钮。通过变体在各页面保持行动号召样式一致。
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variantClass = {
    primary:
      "bg-jade-500 text-ink-950 hover:bg-jade-400 shadow-lg shadow-jade-500/20",
    secondary:
      "border border-mist-300/25 text-mist-100 hover:border-jade-400 hover:text-jade-300",
    ghost: "text-mist-200 hover:text-jade-300",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors",
        variantClass,
        className,
      )}
    >
      {children}
    </Link>
  );
}
