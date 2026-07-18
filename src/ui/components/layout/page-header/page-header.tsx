import type { ReactNode } from "react";
import { Container } from "@/ui/components/primitives/container";

// Inner-page banner: square, light, with display-serif title emphasis.
// 内页横幅：直角浅色，衬线标题强调。
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
    <section className="surface-glow border-b border-mist-100/10">
      <Container className="py-16 sm:py-20">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-jade-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold text-mist-100 sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-mist-300">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
