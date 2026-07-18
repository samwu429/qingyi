import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Square call-to-action link. Primary fills with the brand green; secondary uses
// a hard outline against the light paper ground.
// 直角行动号召链接。主按钮填充品牌绿；次按钮在浅色纸底上使用硬描边。
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
    primary: "bg-jade-500 text-white hover:bg-jade-600",
    secondary:
      "border border-mist-100/20 bg-white text-mist-100 hover:border-jade-500 hover:text-jade-500",
    ghost: "text-mist-300 hover:text-jade-500",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold tracking-wide transition-colors",
        variantClass,
        className,
      )}
    >
      {children}
    </Link>
  );
}
