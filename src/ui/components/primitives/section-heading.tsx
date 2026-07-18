import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Section title block: display serif headline with restrained supporting copy.
// 区块标题：衬线主标题配克制的辅助文案。
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
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-jade-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-bold text-mist-100 sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-base leading-relaxed text-mist-300">{lead}</p> : null}
    </div>
  );
}
