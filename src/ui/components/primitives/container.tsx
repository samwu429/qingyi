import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Horizontal layout container. Wide enough for modern desktops without
// leaving huge empty gutters; fluid side padding for phones.
// 水平布局容器：桌面加宽减少两侧空洞，手机用流动边距。
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
