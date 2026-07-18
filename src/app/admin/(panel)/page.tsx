import Link from "next/link";
import { streamerService } from "@/domain/streamers/streamer.service";
import { postService } from "@/domain/blog/post.service";

export const dynamic = "force-dynamic";

// Back-office overview summarising content counts and offering quick entry
// points to the primary management sections.
// 后台概览：汇总内容数量并提供进入主要管理分区的快捷入口。
export default async function AdminDashboardPage() {
  const [streamerStats, postStats] = await Promise.all([
    streamerService.stats(),
    postService.stats(),
  ]);

  const cards = [
    {
      label: "主播总数",
      value: streamerStats.total,
      detail: `已发布 ${streamerStats.published} · 推荐 ${streamerStats.featured}`,
      href: "/admin/streamers",
    },
    {
      label: "资讯总数",
      value: postStats.total,
      detail: `已发布 ${postStats.published}`,
      href: "/admin/posts",
    },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-mist-100">
          内容概览
        </h1>
        <p className="mt-1 text-sm text-mist-400">
          在此管理主播、资讯与站点页面内容，所有变更即时生效。
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card-surface p-6"
          >
            <p className="text-sm text-mist-400">{card.label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-jade-500">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-mist-400">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction href="/admin/streamers/new" label="新增主播" />
        <QuickAction href="/admin/posts/new" label="发布资讯" />
        <QuickAction href="/admin/pages" label="编辑页面内容" />
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border border-mist-100/15 bg-white px-5 py-4 text-sm font-medium text-mist-200 transition-colors hover:border-jade-500 hover:text-jade-500"
    >
      {label} →
    </Link>
  );
}
