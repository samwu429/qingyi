import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";

// Global footer presenting brand summary, navigation, and legal/company details.
// 全局页脚：展示品牌简介、导航与公司/法务信息。
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-mist-300/10 bg-ink-900">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-jade-500 text-lg font-black text-ink-950">
              青
            </span>
            <span className="text-base font-bold text-mist-100">
              {siteConfig.brandName}
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist-400">
            {siteConfig.description}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-mist-200">快速导航</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {siteConfig.primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-mist-400 transition-colors hover:text-jade-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-mist-200">联系我们</h3>
          <ul className="mt-4 space-y-2 text-sm text-mist-400">
            {siteConfig.contact.address ? (
              <li>{siteConfig.contact.address}</li>
            ) : null}
            {siteConfig.contact.email ? (
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-jade-300"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>

      <div className="border-t border-mist-300/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-mist-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.companyLegalName}. 版权所有.
          </p>
          <p className="text-mist-400">
            {siteConfig.brandName} · {siteConfig.tagline}
          </p>
        </Container>
      </div>
    </footer>
  );
}
