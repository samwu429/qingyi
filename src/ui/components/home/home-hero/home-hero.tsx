import { siteConfig } from "@/config/site.config";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { Container } from "@/ui/components/primitives/container";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { HeroMedia } from "@/ui/components/home/home-hero/hero-media";
import type { HomeContent } from "@/domain/site/site-content.types";

// Cinematic full-bleed hero: official VI logo leads, one headline, one line, CTAs.
// 电影感全幅首屏：正式 VI 标志主导，一句标题、一句说明与行动按钮。
export function HomeHero({ content }: { content: HomeContent }) {
  return (
    <section className="hero-stage">
      <HeroMedia imageUrl={content.heroImageUrl} />

      <div className="hero-stage__veil" />

      <Container className="hero-stage__content">
        <div className="hero-stage__copy">
          <div className="motion-clip">
            <BrandLogo
              variant="primary"
              linked={false}
              priority
              className="hero-stage__brand"
            />
            <span className="sr-only">{siteConfig.brandName}</span>
          </div>
          <h1 className="hero-stage__title motion-rise">{content.heroTitle}</h1>
          <p className="hero-stage__lead motion-rise-delay">
            {content.heroSubtitle}
          </p>
          <div className="hero-stage__actions motion-rise-delay">
            <ButtonLink href={content.heroCtaHref}>
              {content.heroCtaLabel}
            </ButtonLink>
            <ButtonLink href={content.heroSecondaryHref} variant="secondary">
              {content.heroSecondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
