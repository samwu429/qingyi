import type { Prisma, Streamer } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for streamer persistence. Callers in the domain layer
// depend on these narrow methods rather than the Prisma client directly, keeping
// query concerns isolated from business rules.
// 主播持久化的数据访问边界。领域层通过这些窄接口访问，而非直接依赖 Prisma 客户端，
// 从而将查询关注点与业务规则隔离。

export interface StreamerListFilter {
  onlyPublished?: boolean;
  featured?: boolean;
  category?: string;
  skip?: number;
  take?: number;
}

function buildWhere(filter: StreamerListFilter): Prisma.StreamerWhereInput {
  const where: Prisma.StreamerWhereInput = {};
  if (filter.onlyPublished) {
    where.status = "PUBLISHED";
  }
  if (typeof filter.featured === "boolean") {
    where.featured = filter.featured;
  }
  if (filter.category) {
    where.category = filter.category;
  }
  return where;
}

export const streamerRepository = {
  list(filter: StreamerListFilter = {}): Promise<Streamer[]> {
    return prisma.streamer.findMany({
      where: buildWhere(filter),
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: filter.skip,
      take: filter.take,
    });
  },

  count(filter: StreamerListFilter = {}): Promise<number> {
    return prisma.streamer.count({ where: buildWhere(filter) });
  },

  findBySlug(slug: string): Promise<Streamer | null> {
    return prisma.streamer.findUnique({ where: { slug } });
  },

  findById(id: string): Promise<Streamer | null> {
    return prisma.streamer.findUnique({ where: { id } });
  },

  create(data: Prisma.StreamerCreateInput): Promise<Streamer> {
    return prisma.streamer.create({ data });
  },

  update(id: string, data: Prisma.StreamerUpdateInput): Promise<Streamer> {
    return prisma.streamer.update({ where: { id }, data });
  },

  delete(id: string): Promise<Streamer> {
    return prisma.streamer.delete({ where: { id } });
  },

  distinctCategories(): Promise<string[]> {
    return prisma.streamer
      .findMany({
        where: { status: "PUBLISHED", category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      })
      .then((rows) =>
        rows
          .map((row) => row.category)
          .filter((value): value is string => Boolean(value)),
      );
  },
};
