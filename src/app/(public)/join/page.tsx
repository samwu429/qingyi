import type { Metadata } from "next";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { siteContentService } from "@/domain/site/site-content.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解青意传媒的主播扶持政策、签约要求与加入流程。",
};

// Recruitment page presenting benefits, requirements, and the signing process.
// 招募页：展示扶持政策、签约要求与加入流程。
export default async function JoinPage() {
  const join = await siteContentService.get("join");

  return (
    <div>
      <PageHeader eyebrow="Join Us" title="加入青意传媒" description={join.intro} />

      <Container className="py-14">
        {join.benefits.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-mist-100">主播扶持</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {join.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="card-surface rounded-2xl p-7"
                >
                  <h3 className="text-lg font-bold text-jade-300">
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
              <h2 className="text-xl font-bold text-mist-100">签约要求</h2>
              <ul className="mt-6 space-y-3">
                {join.requirements.map((requirement) => (
                  <li
                    key={requirement}
                    className="flex items-start gap-3 text-mist-300"
                  >
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-jade-400" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {join.steps.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold text-mist-100">加入流程</h2>
              <ol className="mt-6 space-y-5">
                {join.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-jade-500 text-sm font-bold text-ink-950">
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

        <div className="surface-glow mt-16 rounded-3xl border border-jade-500/20 bg-ink-900 p-10 text-center">
          <h2 className="text-2xl font-bold text-mist-100">准备好加入了吗？</h2>
          {join.contactNote ? (
            <p className="mx-auto mt-3 max-w-xl text-mist-300">
              {join.contactNote}
            </p>
          ) : null}
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/contact">联系我们报名</ButtonLink>
          </div>
        </div>
      </Container>
    </div>
  );
}
