import { cn } from "@/lib/ui/cn";

// Render an administrator-supplied image URL, falling back to a branded
// placeholder when no source is available.
// 渲染管理员提供的图片地址，缺失时回退到品牌占位符。
export function RemoteImage({
  src,
  alt,
  className,
  fallbackLabel = "青意",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-ink-850 via-white to-jade-500/15 font-display text-3xl font-black text-jade-500/50",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}
