import { siteConfig } from "@/config/site.config";
import { Container } from "@/ui/components/primitives/container";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { SectionHeading } from "@/ui/components/primitives/section-heading";
import { StreamerCard } from "@/ui/components/cards/streamer-card/streamer-card";
import { PostCard } from "@/ui/components/cards/post-card/post-card";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { siteContentService } from "@/domain/site/site-content.service";
import { streamerService } from "@/domain/streamers/streamer.service";
import { postService } from "@/domain/blog/post.service";

// Content is administrator-editable and fetched per request so updates appear
// immediately without a rebuild.
// 内容由管理员可编辑并按请求获取，更新即时生效，无需重新构建。
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [home, featuredStreamers, recentPosts] = await Promise.all([
    siteContentService.get("home"),
    streamerService.listFeatured(6),
    postService.listRecent(3),
  ]);

  return (
    <div>
      {/*
        First viewport: one composition — brand, headline, one sentence, CTAs,
        and a full-bleed visual plane. Stats and secondary marketing sit below.
        首屏单一构图：品牌、标题、一句说明、行动按钮与全幅视觉；统计与次级营销下移。
      */}
      <section className="hero-plane min-h-[calc(100vh-4rem)]">
        <Container className="grid min-h-[calc(100vh-4rem)] items-end gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center py-16 lg:py-24 lg:pr-12">
            <p className="motion-fade font-display text-5xl font-black leading-none text-jade-500 sm:text-6xl">
              {siteConfig.brandName}
            </p>
            <h1 className="motion-rise mt-6 max-w-xl font-display text-3xl font-bold leading-tight text-mist-100 sm:text-4xl lg:text-[2.75rem]">
              {home.heroTitle}
            </h1>
            <p className="motion-rise-delay mt-5 max-w-md text-base leading-relaxed text-mist-300">
              {home.heroSubtitle}
            </p>
            <div className="motion-rise-delay mt-9 flex flex-wrap gap-3">
              <ButtonLink href={home.heroCtaHref}>
                {home.heroCtaLabel}
              </ButtonLink>
              <ButtonLink href={home.heroSecondaryHref} variant="secondary">
                {home.heroSecondaryLabel}
              </ButtonLink>
            </div>
          </div>

          <div className="motion-image relative min-h-[42vh] border-t border-mist-100/10 lg:min-h-full lg:border-l lg:border-t-0">
            <RemoteImage
              src={home.heroImageUrl}
              alt="青意传媒直播现场"
              className="absolute inset-0 h-full w-full object-cover"
              fallbackLabel="青意"
            />
          </div>
        </Container>
      </section>

      {home.stats.length > 0 ? (
        <section className="border-y border-mist-100/10 bg-white">
          <Container className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-4">
            {home.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-bold text-jade-500 sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-mist-400">{stat.label}</p>
              </div>
            ))}
          </Container>
        </section>
      ) : null}

      {home.highlights.length > 0 ? (
        <section className="py-20">
          <Container>
            <SectionHeading
              eyebrow="Why Qingyi"
              title="为什么选择青意传媒"
              lead="从零到头部，我们提供主播成长所需的一切支持。"
            />
            <div className="mt-12 grid gap-px bg-mist-100/10 md:grid-cols-3">
              {home.highlights.map((item, index) => (
                <div
                  key={item.title}
                  className="bg-ink-950 p-8 transition-colors hover:bg-white"
                >
                  <p className="font-display text-sm text-jade-500">
                    0{index + 1}
                  </p>
                  <h3 className="mt-4 font-display text-xl font-bold text-mist-100">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {featuredStreamers.length > 0 ? (
        <section className="pb-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Talents"
                title="签约主播"
                lead="风格各异的优质主播，总有一位打动你。"
              />
              <ButtonLink href="/streamers" variant="ghost">
                查看全部 →
              </ButtonLink>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredStreamers.map((streamer) => (
                <StreamerCard key={streamer.id} streamer={streamer} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {recentPosts.length > 0 ? (
        <section className="pb-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="News"
                title="最新动态"
                lead="了解公会资讯、活动与主播成长故事。"
              />
              <ButtonLink href="/blog" variant="ghost">
                更多资讯 →
              </ButtonLink>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="pb-24">
        <Container>
          <div className="border border-mist-100/10 bg-white px-8 py-14 text-center sm:px-16">
            <h2 className="font-display text-2xl font-bold text-mist-100 sm:text-3xl">
              准备好开启你的直播事业了吗？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-mist-300">
              加入青意传媒，让专业团队陪你一起成长，把热爱变成事业。
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/join">立即加入公会</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
