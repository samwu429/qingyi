import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Square tag label used for categories and metadata—never a pill.
// 分类与元数据用的直角标签，不做胶囊形。
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
      ? "border-jade-500/40 bg-jade-500/10 text-jade-600"
      : "border-mist-100/12 bg-ink-850 text-mist-300";
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[11px] font-medium tracking-wide",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
