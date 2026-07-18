import type { Metadata } from "next";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { siteContentService } from "@/domain/site/site-content.service";
import { siteConfig } from "@/config/site.config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "联系我们",
  description: "青意传媒商务合作与主播签约联系方式。",
};

interface ContactRow {
  label: string;
  value: string;
  href?: string;
}

// Contact information page. Only populated channels are rendered so empty
// fields never surface as blank rows.
// 联系方式页。仅渲染已填写的渠道，空字段不会显示为空行。
export default async function ContactPage() {
  const contact = await siteContentService.get("contact");

  const rows: ContactRow[] = [
    { label: "公司地址", value: contact.address },
    {
      label: "电子邮箱",
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : undefined,
    },
    {
      label: "联系电话",
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone}` : undefined,
    },
    { label: "微信", value: contact.wechat },
    { label: "微博", value: contact.weibo, href: contact.weibo || undefined },
  ].filter((row) => Boolean(row.value));

  return (
    <div>
      <PageHeader
        eyebrow="Contact"
        title="联系我们"
        description={contact.intro}
      />

      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden border border-mist-100/10">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 border-b border-mist-100/10 bg-white p-6 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-mist-400">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="font-medium text-jade-500 hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="font-medium text-mist-100">
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-mist-100/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-mist-100">
              {siteConfig.brandName}
            </h2>
            <p className="mt-2 text-sm text-mist-400">
              {siteConfig.companyLegalName}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-mist-300">
              {siteConfig.description}
            </p>
          </aside>
        </div>
      </Container>
    </div>
  );
}
