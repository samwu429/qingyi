import type { BlogPost, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for blog post persistence. Keeps Prisma query details out
// of the domain services that depend on it.
// 博客文章持久化的数据访问边界，使依赖它的领域服务与 Prisma 查询细节解耦。

export interface PostListFilter {
  onlyPublished?: boolean;
  tag?: string;
  skip?: number;
  take?: number;
}

function buildWhere(filter: PostListFilter): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {};
  if (filter.onlyPublished) {
    where.status = "PUBLISHED";
    where.publishedAt = { not: null, lte: new Date() };
  }
  if (filter.tag) {
    where.tags = { has: filter.tag };
  }
  return where;
}

function orderBy(
  filter: PostListFilter,
): Prisma.BlogPostOrderByWithRelationInput[] {
  if (filter.onlyPublished) {
    return [{ publishedAt: "desc" }];
  }
  return [{ updatedAt: "desc" }];
}

export const postRepository = {
  list(filter: PostListFilter = {}): Promise<BlogPost[]> {
    return prisma.blogPost.findMany({
      where: buildWhere(filter),
      orderBy: orderBy(filter),
      skip: filter.skip,
      take: filter.take,
    });
  },

  count(filter: PostListFilter = {}): Promise<number> {
    return prisma.blogPost.count({ where: buildWhere(filter) });
  },

  findBySlug(slug: string): Promise<BlogPost | null> {
    return prisma.blogPost.findUnique({ where: { slug } });
  },

  findById(id: string): Promise<BlogPost | null> {
    return prisma.blogPost.findUnique({ where: { id } });
  },

  create(data: Prisma.BlogPostCreateInput): Promise<BlogPost> {
    return prisma.blogPost.create({ data });
  },

  update(id: string, data: Prisma.BlogPostUpdateInput): Promise<BlogPost> {
    return prisma.blogPost.update({ where: { id }, data });
  },

  delete(id: string): Promise<BlogPost> {
    return prisma.blogPost.delete({ where: { id } });
  },
};
