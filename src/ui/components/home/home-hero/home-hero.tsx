import { siteConfig } from "@/config/site.config";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { HeroMedia } from "@/ui/components/home/home-hero/hero-media";
import type { HomeContent } from "@/domain/site/site-content.types";

// Full-bleed hero: copy anchors to the left edge of a wide stage so the sage
// art owns the right half — not a narrow column floating in empty margins.
// 全幅首屏：文案靠左贴宽舞台，青绿视觉占右半，避免窄栏漂在两侧空白里。
export function HomeHero({ content }: { content: HomeContent }) {
  return (
    <section className="hero-stage">
      <HeroMedia imageUrl={content.heroImageUrl} />

      <div className="hero-stage__veil" />

      <div className="hero-stage__content">
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
      </div>
    </section>
  );
}
