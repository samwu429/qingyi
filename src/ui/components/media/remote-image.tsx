import { cn } from "@/lib/ui/cn";

// Render an administrator-supplied image URL, falling back to a branded
// placeholder when no source is available. A plain img element is used
// deliberately because sources are arbitrary external URLs entered in the admin
// panel rather than a fixed, pre-configured set of hosts.
// 渲染管理员提供的图片地址，缺失时回退到品牌占位符。此处刻意使用原生 img 元素，
// 因为图片来源是后台录入的任意外部地址，而非固定预配置的主机集合。
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
          "grid place-items-center bg-gradient-to-br from-ink-700 to-ink-850 text-2xl font-black text-jade-500/40",
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
