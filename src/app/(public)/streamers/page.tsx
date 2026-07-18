import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { StreamerCard } from "@/ui/components/cards/streamer-card/streamer-card";
import { Pagination } from "@/ui/components/primitives/pagination";
import { streamerService } from "@/domain/streamers/streamer.service";
import { cn } from "@/lib/ui/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "签约创作者",
  description:
    "青意传媒签约创作者名录：覆盖娱乐、才艺、游戏等赛道，展示人设定位与内容方向。",
};

// Public streamer roster with category filtering and pagination. Query
// parameters are the single source of truth for the current view state.
// 公开主播名录，支持分类筛选与分页；查询参数是当前视图状态的唯一来源。
export default async function StreamersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const category = params.category?.trim() || undefined;

  const [result, categories] = await Promise.all([
    streamerService.listPublished({ page }, category),
    streamerService.listCategories(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Creators"
        title="签约创作者"
        description="多元赛道的内容创作者矩阵，覆盖娱乐、才艺、游戏与生活等内容方向。"
      />

      <Container className="py-14">
        {categories.length > 0 ? (
          <div className="mb-10 flex flex-wrap gap-2">
            <FilterChip href="/streamers" active={!category}>
              全部
            </FilterChip>
            {categories.map((item) => (
              <FilterChip
                key={item}
                href={`/streamers?category=${encodeURIComponent(item)}`}
                active={category === item}
              >
                {item}
              </FilterChip>
            ))}
          </div>
        ) : null}

        {result.items.length === 0 ? (
          <p className="border border-mist-100/10 bg-white p-10 text-center text-mist-400">
            暂无主播信息，敬请期待。
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((streamer) => (
              <StreamerCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
        )}

        <Pagination
          basePath="/streamers"
          page={result.page}
          totalPages={result.totalPages}
          query={{ category }}
        />
      </Container>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border px-4 py-2 text-sm transition-colors",
        active
          ? "border-jade-500 bg-jade-500 text-white"
          : "border-mist-100/15 bg-white text-mist-300 hover:border-jade-500",
      )}
    >
      {children}
    </Link>
  );
}
