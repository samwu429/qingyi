import type { Metadata } from "next";
import { Container } from "@/ui/components/primitives/container";
import { PageHeader } from "@/ui/components/layout/page-header/page-header";
import { PostCard } from "@/ui/components/cards/post-card/post-card";
import { Pagination } from "@/ui/components/primitives/pagination";
import { postService } from "@/domain/blog/post.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "动态资讯",
  description: "青意传媒最新公会动态、行业资讯与主播成长故事。",
};

// Paginated public blog index listing published posts newest-first.
// 分页的公开博客首页，按时间倒序列出已发布文章。
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const tag = params.tag?.trim() || undefined;

  const result = await postService.listPublished({ page }, tag);

  return (
    <div>
      <PageHeader
        eyebrow="News"
        title="动态资讯"
        description="关注公会最新动态、平台活动与主播成长故事。"
      />

      <Container className="py-14">
        {tag ? (
          <p className="mb-8 text-sm text-mist-400">
            正在筛选标签：
            <span className="text-jade-300">#{tag}</span>
          </p>
        ) : null}

        {result.items.length === 0 ? (
          <p className="rounded-2xl border border-mist-300/10 bg-ink-900 p-10 text-center text-mist-400">
            暂无资讯内容，敬请期待。
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <Pagination
          basePath="/blog"
          page={result.page}
          totalPages={result.totalPages}
          query={{ tag }}
        />
      </Container>
    </div>
  );
}
