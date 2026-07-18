import type { Metadata } from "next";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { JoinInquiryForm } from "@/ui/components/public/join/join-inquiry-form";
import { siteContentService } from "@/domain/site/site-content.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解青意传媒的主播扶持政策、签约要求与加入流程，并在线留言报名。",
};

// Recruitment page presenting benefits, requirements, process, and a public
// enquiry form so candidates can leave contact details for follow-up.
// 招募页：展示扶持政策、签约要求、流程，以及可供候选人留言留下联系方式的表单。
export default async function JoinPage() {
  const join = await siteContentService.get("join");

  return (
    <div>
      <PageHeader
        eyebrow="Join Us"
        title="加入青意传媒"
        description={join.intro}
      />

      <Container className="py-14">
        {join.benefits.length > 0 ? (
          <section>
            <h2 className="font-display text-xl font-bold text-mist-100">
              主播扶持
            </h2>
            <div className="mt-6 grid gap-px bg-mist-100/10 md:grid-cols-3">
              {join.benefits.map((benefit, index) => (
                <div key={`${benefit.title}-${index}`} className="bg-white p-7">
                  <h3 className="font-display text-lg font-bold text-jade-500">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist-300">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          {join.requirements.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-bold text-mist-100">
                签约要求
              </h2>
              <ul className="mt-6 space-y-3">
                {join.requirements.map((requirement, index) => (
                  <li
                    key={`${requirement}-${index}`}
                    className="flex items-start gap-3 text-mist-300"
                  >
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 bg-jade-500" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {join.steps.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-bold text-mist-100">
                加入流程
              </h2>
              <ol className="mt-6 space-y-5">
                {join.steps.map((step, index) => (
                  <li key={`${step.title}-${index}`} className="flex gap-4">
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center bg-jade-500 font-display text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-mist-100">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-mist-400">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="border border-mist-100/10 bg-white p-8">
            <h2 className="font-display text-2xl font-bold text-mist-100">
              准备好加入了吗？
            </h2>
            {join.contactNote ? (
              <p className="mt-3 text-mist-300">{join.contactNote}</p>
            ) : null}
            <p className="mt-4 text-sm text-mist-400">
              请在右侧填写姓名与联系方式，我们会尽快与你联系。
            </p>
          </div>
          <JoinInquiryForm />
        </div>
      </Container>
    </div>
  );
}
