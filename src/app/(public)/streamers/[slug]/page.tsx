import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/ui/components/primitives/container";
import { Badge } from "@/ui/components/primitives/badge";
import { ButtonLink } from "@/ui/components/primitives/button-link";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { streamerService } from "@/domain/streamers/streamer.service";
import { formatFollowers } from "@/lib/text/format";
import type { SocialLink } from "@/domain/streamers/streamer.schema";

export const dynamic = "force-dynamic";

// Coerce the loosely-typed socials JSON column into a validated link list.
// 将弱类型的 socials JSON 列收敛为经校验的链接列表。
function parseSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is SocialLink =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as SocialLink).label === "string" &&
      typeof (item as SocialLink).url === "string",
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const streamer = await streamerService.getPublishedBySlug(slug);
  if (!streamer) {
    return { title: "主播不存在" };
  }
  return {
    title: streamer.name,
    description: streamer.tagline ?? undefined,
  };
}

export default async function StreamerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const streamer = await streamerService.getPublishedBySlug(slug);
  if (!streamer) {
    notFound();
  }

  const socials = parseSocials(streamer.socials);

  return (
    <div>
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <RemoteImage
          src={streamer.coverUrl}
          alt={`${streamer.name} 封面`}
          className="h-full w-full object-cover"
          fallbackLabel="青意传媒"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <Container className="-mt-20 pb-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-ink-950 shadow-xl">
            <RemoteImage
              src={streamer.avatarUrl}
              alt={streamer.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-mist-100">
                {streamer.name}
              </h1>
              {streamer.featured ? <Badge tone="jade">推荐主播</Badge> : null}
            </div>
            {streamer.tagline ? (
              <p className="mt-2 text-mist-300">{streamer.tagline}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-mist-400">
              {streamer.category ? <span>分类：{streamer.category}</span> : null}
              {streamer.platform ? <span>平台：{streamer.platform}</span> : null}
              {streamer.followers > 0 ? (
                <span>
                  粉丝：
                  <span className="font-semibold text-jade-300">
                    {formatFollowers(streamer.followers)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          {streamer.platformUrl ? (
            <ButtonLink href={streamer.platformUrl}>进入直播间</ButtonLink>
          ) : null}
        </div>

        {streamer.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {streamer.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        {streamer.bio ? (
          <div className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-mist-100">主播简介</h2>
            <div className="prose-content mt-4 whitespace-pre-wrap">
              {streamer.bio}
            </div>
          </div>
        ) : null}

        {socials.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-mist-100">社交平台</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((social) => (
                <a
                  key={`${social.label}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-mist-300/15 px-5 py-2 text-sm text-mist-200 transition-colors hover:border-jade-400 hover:text-jade-300"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14">
          <Link
            href="/streamers"
            className="text-sm text-mist-400 transition-colors hover:text-jade-300"
          >
            ← 返回主播列表
          </Link>
        </div>
      </Container>
    </div>
  );
}
