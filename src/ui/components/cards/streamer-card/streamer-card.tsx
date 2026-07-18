import Link from "next/link";
import type { Streamer } from "@prisma/client";
import { Badge } from "@/ui/components/primitives/badge";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { formatFollowers } from "@/lib/text/format";

// Roster card summarising a single streamer and linking to the detail page.
// 名录卡片：概览单个主播信息并链接至详情页。
export function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <Link
      href={`/streamers/${streamer.slug}`}
      className="card-surface group flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RemoteImage
          src={streamer.coverUrl ?? streamer.avatarUrl}
          alt={`${streamer.name} 封面`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {streamer.featured ? (
          <span className="absolute left-3 top-3">
            <Badge tone="jade">推荐主播</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-mist-100 group-hover:text-jade-300">
              {streamer.name}
            </h3>
            {streamer.category ? (
              <p className="mt-1 text-xs text-mist-400">{streamer.category}</p>
            ) : null}
          </div>
          {streamer.followers > 0 ? (
            <div className="text-right">
              <p className="text-sm font-bold text-jade-300">
                {formatFollowers(streamer.followers)}
              </p>
              <p className="text-[10px] text-mist-400">粉丝</p>
            </div>
          ) : null}
        </div>

        {streamer.tagline ? (
          <p className="line-clamp-2 text-sm text-mist-300">
            {streamer.tagline}
          </p>
        ) : null}

        {streamer.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {streamer.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
