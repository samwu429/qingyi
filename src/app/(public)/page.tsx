import { Container } from "@/ui/components/primitives/container";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { SectionHeading } from "@/ui/components/primitives/section-heading";
import { StreamerCard } from "@/ui/components/cards/streamer-card/streamer-card";
import { PostCard } from "@/ui/components/cards/post-card/post-card";
import { HomeHero } from "@/ui/components/home/home-hero/home-hero";
import { ConvergenceVenn } from "@/ui/components/home/convergence-venn/convergence-venn";
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
      <HomeHero content={home} />

      {home.stats.length > 0 ? (
        <section className="border-y border-mist-100/10 bg-white">
          <Container className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-4">
            {home.stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`}>
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
              eyebrow="Creative Ops"
              title="内容产业里的三件实事"
              lead="人设、分发、变现三件能落地的事；站在网络、计算与内容的交汇处做直播与短视频。"
            />
            <div className="ops-compose mt-12">
              <ol className="ops-compose__list">
                {home.highlights.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="ops-compose__item">
                    <p className="ops-compose__index">0{index + 1}</p>
                    <div>
                      <h3 className="ops-compose__title">{item.title}</h3>
                      <p className="ops-compose__body">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ConvergenceVenn className="ops-compose__venn" />
            </div>
          </Container>
        </section>
      ) : null}

      {featuredStreamers.length > 0 ? (
        <section className="pb-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Creators"
                title="签约创作者"
                lead="不同赛道的内容创作者，正在把个人风格做成可持续的内容品牌。"
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
                eyebrow="Updates"
                title="公会动态"
                lead="平台趋势、运营复盘与创作者成长观察。"
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
              准备好经营你的内容品牌了吗？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-mist-300">
              加入青意传媒，用专业运营把创意、人设与平台分发接成一条可复利的成长路径。
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/join">申请加入</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
