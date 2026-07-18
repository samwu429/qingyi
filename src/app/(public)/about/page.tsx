import type { Metadata } from "next";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { siteContentService } from "@/domain/site/site-content.service";
import { siteConfig } from "@/config/site.config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于我们",
  description: siteConfig.description,
};

// Company introduction page driven by editable site content.
// 由可编辑站点内容驱动的公司介绍页。
export default async function AboutPage() {
  const about = await siteContentService.get("about");

  return (
    <div>
      <PageHeader eyebrow="About" title="关于青意传媒" />

      <Container className="py-14">
        <p className="max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-mist-200">
          {about.intro}
        </p>

        {about.sections.length > 0 ? (
          <div className="mt-14 grid gap-px bg-mist-100/10 md:grid-cols-2">
            {about.sections.map((section) => (
              <div key={section.title} className="bg-white p-8">
                <h2 className="font-display text-xl font-bold text-mist-100">
                  {section.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-mist-300">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-14 border border-mist-100/10 bg-white p-8">
          <h2 className="font-display text-lg font-bold text-mist-100">
            公司信息
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-mist-400">法定名称</dt>
              <dd className="mt-1 text-mist-200">
                {siteConfig.companyLegalName}
              </dd>
            </div>
            <div>
              <dt className="text-mist-400">品牌</dt>
              <dd className="mt-1 text-mist-200">
                {siteConfig.brandName} / {siteConfig.brandNameEn}
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </div>
  );
}
