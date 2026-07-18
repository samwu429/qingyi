import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/ui/components/primitives/container";
import { Badge } from "@/ui/components/primitives/badge";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { postService } from "@/domain/blog/post.service";
import { renderMarkdown } from "@/lib/content/markdown";
import { formatDate } from "@/lib/text/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await postService.getPublishedBySlug(slug);
  if (!post) {
    return { title: "文章不存在" };
  }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

// Public article page rendering sanitised Markdown content.
// 公开文章页，渲染经净化的 Markdown 内容。
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await postService.getPublishedBySlug(slug);
  if (!post) {
    notFound();
  }

  const html = renderMarkdown(post.content);

  return (
    <article>
      <Container className="max-w-3xl py-14">
        <Link
          href="/blog"
          className="text-sm text-mist-400 transition-colors hover:text-jade-500"
        >
          ← 返回资讯列表
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3 text-sm text-mist-400">
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
            {post.author ? <span>· {post.author}</span> : null}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-mist-100 sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg text-mist-300">{post.excerpt}</p>
          ) : null}
        </header>

        {post.coverUrl ? (
          <div className="mt-8 overflow-hidden border border-mist-100/10">
            <RemoteImage
              src={post.coverUrl}
              alt={post.title}
              className="aspect-video w-full object-cover"
              fallbackLabel="资讯"
            />
          </div>
        ) : null}

        <div
          className="prose-content mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-mist-300/10 pt-8">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge>#{tag}</Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </Container>
    </article>
  );
}
