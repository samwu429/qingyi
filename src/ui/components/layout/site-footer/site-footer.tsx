import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { Container } from "@/ui/components/primitives/container";

// Dark footer band: transparent On Dark lockup per VI (no baked black logo tile).
// 深色页脚：按 VI 使用透明 On Dark 标志，不用自带黑底的色块标。
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-[#121212] text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandLogo
            variant="onDark"
            className="h-11 w-auto max-w-[min(300px,85vw)] object-contain object-left sm:h-12"
          />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
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
            <li>
              <Link
                href="/join#inquiry"
                className="transition-colors hover:text-white"
              >
                在线留言
              </Link>
            </li>
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
