import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import type { HomeContent } from "@/domain/site/site-content.types";

// Cinematic full-bleed hero: brand leads, one headline, one sentence, CTAs, and
// a dominant visual plane. Photo when available; otherwise a crafted stage art.
// 电影感全幅首屏：品牌主导、一句标题、一句说明、行动按钮与主导视觉平面；
// 有图用图，无图时使用精心构图的舞台视觉。
export function HomeHero({ content }: { content: HomeContent }) {
  const hasPhoto = Boolean(content.heroImageUrl?.trim());

  return (
    <section className="hero-stage">
      <div className="hero-stage__media" aria-hidden={!hasPhoto}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.heroImageUrl}
            alt=""
            className="hero-stage__photo"
          />
        ) : (
          <div className="hero-stage__art">
            <span className="hero-stage__glyph">青</span>
            <span className="hero-stage__mark">{siteConfig.brandNameEn}</span>
            <div className="hero-stage__bars" />
          </div>
        )}
      </div>

      <div className="hero-stage__veil" />

      <Container className="hero-stage__content">
        <div className="hero-stage__copy">
          <p className="hero-stage__brand motion-clip">
            {siteConfig.brandName}
          </p>
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
