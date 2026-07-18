import type { BlogPost, Prisma } from "@prisma/client";
import {
  postRepository,
  type PostListFilter,
} from "@/infrastructure/database/repositories/post.repository";
import {
  buildPaginated,
  normalizePagination,
  type Paginated,
  type PaginationInput,
} from "@/domain/shared/pagination";
import {
  normalizeSlugParam,
  slugify,
  withUniqueSuffix,
} from "@/lib/text/slug";
import type { PostInput } from "@/domain/blog/post.schema";

// Application services for the dynamic blog. They manage slug uniqueness and the
// publication timestamp so a post gains publishedAt exactly when it transitions
// to PUBLISHED, keeping public ordering stable.
// 动态博客的应用服务：管理 slug 唯一性与发布时间戳，使文章在切换为 PUBLISHED 时才获得
// publishedAt，从而保证前台排序稳定。

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function resolveUniqueSlug(
  desired: string | undefined,
  title: string,
  currentId?: string,
): Promise<string> {
  const base = slugify(desired?.trim() || title) || withUniqueSuffix("post");
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await postRepository.findBySlug(candidate);
    if (!existing || existing.id === currentId) {
      return candidate;
    }
    candidate = withUniqueSuffix(base);
  }
  return withUniqueSuffix(base);
}

// Derive the published timestamp: assign now on first publish, preserve the
// existing value on subsequent edits, and clear it when unpublished.
// 推导发布时间：首次发布时赋当前时间，后续编辑保留原值，取消发布时清空。
function derivePublishedAt(
  status: PostInput["status"],
  existing: Date | null | undefined,
): Date | null {
  if (status !== "PUBLISHED") {
    return null;
  }
  return existing ?? new Date();
}

export const postService = {
  async listPublished(
    pagination?: Partial<PaginationInput>,
    tag?: string,
  ): Promise<Paginated<BlogPost>> {
    const safe = normalizePagination(pagination, 6);
    const filter: PostListFilter = {
      onlyPublished: true,
      tag,
      skip: (safe.page - 1) * safe.pageSize,
      take: safe.pageSize,
    };
    const [items, total] = await Promise.all([
      postRepository.list(filter),
      postRepository.count({ onlyPublished: true, tag }),
    ]);
    return buildPaginated(items, total, safe);
  },

  listRecent(limit = 3): Promise<BlogPost[]> {
    return postRepository.list({ onlyPublished: true, take: limit });
  },

  listAllForAdmin(): Promise<BlogPost[]> {
    return postRepository.list();
  },

  async stats(): Promise<{ total: number; published: number }> {
    const [total, published] = await Promise.all([
      postRepository.count(),
      postRepository.count({ onlyPublished: true }),
    ]);
    return { total, published };
  },

  async getPublishedBySlug(slug: string): Promise<BlogPost | null> {
    const normalized = normalizeSlugParam(slug);
    const candidates = Array.from(
      new Set([normalized, slug.trim(), encodeURIComponent(normalized)]),
    );
    for (const candidate of candidates) {
      if (!candidate) continue;
      const post = await postRepository.findBySlug(candidate);
      if (post?.status === "PUBLISHED") {
        return post;
      }
    }
    return null;
  },

  getById(id: string): Promise<BlogPost | null> {
    return postRepository.findById(id);
  },

  async create(input: PostInput): Promise<BlogPost> {
    const slug = await resolveUniqueSlug(input.slug, input.title);
    return postRepository.create({
      slug,
      title: input.title.trim(),
      excerpt: emptyToNull(input.excerpt),
      content: input.content,
      coverUrl: emptyToNull(input.coverUrl),
      author: emptyToNull(input.author),
      tags: input.tags,
      status: input.status,
      publishedAt: derivePublishedAt(input.status, null),
    });
  },

  async update(id: string, input: PostInput): Promise<BlogPost> {
    const [slug, existing] = await Promise.all([
      resolveUniqueSlug(input.slug, input.title, id),
      postRepository.findById(id),
    ]);
    const data: Prisma.BlogPostUpdateInput = {
      slug,
      title: input.title.trim(),
      excerpt: emptyToNull(input.excerpt),
      content: input.content,
      coverUrl: emptyToNull(input.coverUrl),
      author: emptyToNull(input.author),
      tags: input.tags,
      status: input.status,
      publishedAt: derivePublishedAt(input.status, existing?.publishedAt),
    };
    return postRepository.update(id, data);
  },

  delete(id: string): Promise<BlogPost> {
    return postRepository.delete(id);
  },
};
