import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Consistent section header with an eyebrow label, title, and optional lead text.
// 统一的区块标题：包含小标签、主标题与可选引导文案。
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-jade-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold text-mist-100 sm:text-3xl">{title}</h2>
      {lead ? <p className="mt-4 text-mist-300">{lead}</p> : null}
    </div>
  );
}
