import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Small pill label used for tags, categories, and status markers.
// 用于标签、分类与状态标记的小型胶囊标签。
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "jade";
  className?: string;
}) {
  const toneClass =
    tone === "jade"
      ? "border-jade-500/40 bg-jade-500/10 text-jade-300"
      : "border-mist-300/15 bg-ink-700/60 text-mist-300";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
