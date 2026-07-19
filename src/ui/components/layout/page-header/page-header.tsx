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
      <Container className="py-12 sm:py-16 lg:py-20">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-jade-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl font-display text-[1.75rem] font-bold leading-tight text-mist-100 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-mist-300 sm:text-base">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
