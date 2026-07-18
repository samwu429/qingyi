import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Horizontal layout container enforcing a consistent max width and gutters.
// 水平布局容器，统一最大宽度与两侧留白。
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
