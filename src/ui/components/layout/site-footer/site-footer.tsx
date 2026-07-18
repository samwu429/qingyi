import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";

// Global footer on a deep green band for contrast against the light page body.
// 全局页脚使用深绿色带，与浅色页面主体形成对比。
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-[#0f1f1b] text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-jade-500 font-display text-lg font-bold text-white">
              青
            </span>
            <span className="font-display text-base font-bold">
              {siteConfig.brandName}
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            {siteConfig.description}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/90">快速导航</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {siteConfig.primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white/60 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/90">联系我们</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            {siteConfig.contact.address ? (
              <li>{siteConfig.contact.address}</li>
            ) : null}
            {siteConfig.contact.email ? (
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-white"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.companyLegalName} 与{" "}
            {siteConfig.copyright.coOwner} 共同所有。技术支持与商务咨询请访问{" "}
            <a
              href={siteConfig.copyright.personalSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
            >
              {siteConfig.copyright.personalSiteLabel}
            </a>
            。
          </p>
          <p>
            {siteConfig.brandName} · {siteConfig.tagline}
          </p>
        </Container>
      </div>
    </footer>
  );
}
