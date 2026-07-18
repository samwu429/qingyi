import type { ReactNode } from "react";
import { Container } from "@/ui/components/primitives/container";

// Compact page banner used at the top of inner public pages for a consistent
// title treatment.
// 内页顶部使用的紧凑横幅，为标题提供统一样式。
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="surface-glow border-b border-mist-300/10">
      <Container className="py-16 sm:py-20">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-jade-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-black text-mist-100 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-mist-300">{description}</p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
