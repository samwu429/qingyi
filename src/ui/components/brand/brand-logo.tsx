import Link from "next/link";
import { cn } from "@/lib/ui/cn";

type BrandLogoVariant = "primary" | "onDark" | "mark" | "markWhite";

const SRC: Record<BrandLogoVariant, string> = {
  primary: "/brand/QingyiMedia_Logo_Primary.svg",
  onDark: "/brand/QingyiMedia_Logo_OnDark.svg",
  mark: "/brand/QingyiMedia_Mark.svg",
  markWhite: "/brand/QingyiMedia_Mark_White.svg",
};

// Official VI lockups from the brand pack. Prefer these over ad-hoc「青」tiles.
// 使用正式 VI 标志文件，避免临时拼的「青」色块。
export function BrandLogo({
  variant = "primary",
  className,
  priority = false,
  href = "/",
  linked = true,
}: {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  href?: string;
  linked?: boolean;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand marks from /public
    <img
      src={SRC[variant]}
      alt="青意传媒 Qingyi Media"
      className={cn("block h-auto w-auto max-w-full", className)}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );

  if (!linked) {
    return image;
  }

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center"
      aria-label="返回首页"
    >
      {image}
    </Link>
  );
}
