import Link from "next/link";
import type { BlogPost } from "@prisma/client";
import { Badge } from "@/ui/components/primitives/badge";
import { RemoteImage } from "@/ui/components/media/remote-image";
import { formatDate } from "@/lib/text/format";

// Blog listing card summarising a published post.
// 博客列表卡片：概览一篇已发布文章。
export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="card-surface group flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        <RemoteImage
          src={post.coverUrl}
          alt={`${post.title} 配图`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackLabel="资讯"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs text-mist-400">
          <time dateTime={post.publishedAt?.toISOString()}>
            {formatDate(post.publishedAt)}
          </time>
          {post.author ? <span>· {post.author}</span> : null}
        </div>

        <h3 className="line-clamp-2 text-lg font-bold text-mist-100 group-hover:text-jade-300">
          {post.title}
        </h3>

        {post.excerpt ? (
          <p className="line-clamp-3 text-sm text-mist-300">{post.excerpt}</p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
