import type { Prisma, Streamer } from "@prisma/client";
import {
  streamerRepository,
  type StreamerListFilter,
} from "@/infrastructure/database/repositories/streamer.repository";
import {
  buildPaginated,
  normalizePagination,
  type Paginated,
  type PaginationInput,
} from "@/domain/shared/pagination";
import { slugify, withUniqueSuffix } from "@/lib/text/slug";
import type { StreamerInput } from "@/domain/streamers/streamer.schema";

// Application services orchestrating streamer use cases. They own slug
// derivation, uniqueness handling, and translation between validated input and
// the persistence shape, so route handlers stay thin.
// 主播用例的应用服务：负责 slug 生成、唯一性处理，以及在已校验输入与持久化结构之间的转换，
// 使路由处理器保持精简。

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Convert validated input into a persistence payload shared by create/update.
// 将已校验输入转换为创建/更新共用的持久化载荷。
function toPersistencePayload(input: StreamerInput) {
  return {
    name: input.name.trim(),
    tagline: emptyToNull(input.tagline),
    bio: emptyToNull(input.bio),
    avatarUrl: emptyToNull(input.avatarUrl),
    coverUrl: emptyToNull(input.coverUrl),
    platform: emptyToNull(input.platform),
    platformUrl: emptyToNull(input.platformUrl),
    category: emptyToNull(input.category),
    tags: input.tags,
    followers: input.followers,
    socials: input.socials as unknown as Prisma.InputJsonValue,
    status: input.status,
    featured: input.featured,
    sortOrder: input.sortOrder,
  };
}

// Resolve a unique slug, honouring an explicit value when provided and falling
// back to the streamer name. Retries with a random suffix on collision.
// 解析唯一 slug：优先使用显式值，否则回退到主播名称；冲突时追加随机后缀重试。
async function resolveUniqueSlug(
  desired: string | undefined,
  name: string,
  currentId?: string,
): Promise<string> {
  const base = slugify(desired?.trim() || name) || withUniqueSuffix("streamer");
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await streamerRepository.findBySlug(candidate);
    if (!existing || existing.id === currentId) {
      return candidate;
    }
    candidate = withUniqueSuffix(base);
  }
  return withUniqueSuffix(base);
}

export const streamerService = {
  async listPublished(
    pagination?: Partial<PaginationInput>,
    category?: string,
  ): Promise<Paginated<Streamer>> {
    const safe = normalizePagination(pagination);
    const filter: StreamerListFilter = {
      onlyPublished: true,
      category,
      skip: (safe.page - 1) * safe.pageSize,
      take: safe.pageSize,
    };
    const [items, total] = await Promise.all([
      streamerRepository.list(filter),
      streamerRepository.count({ onlyPublished: true, category }),
    ]);
    return buildPaginated(items, total, safe);
  },

  listFeatured(limit = 6): Promise<Streamer[]> {
    return streamerRepository.list({
      onlyPublished: true,
      featured: true,
      take: limit,
    });
  },

  listAllForAdmin(): Promise<Streamer[]> {
    return streamerRepository.list();
  },

  async stats(): Promise<{ total: number; published: number; featured: number }> {
    const [total, published, featured] = await Promise.all([
      streamerRepository.count(),
      streamerRepository.count({ onlyPublished: true }),
      streamerRepository.count({ featured: true }),
    ]);
    return { total, published, featured };
  },

  getPublishedBySlug(slug: string): Promise<Streamer | null> {
    return streamerRepository.findBySlug(slug).then((streamer) => {
      if (!streamer || streamer.status !== "PUBLISHED") {
        return null;
      }
      return streamer;
    });
  },

  getById(id: string): Promise<Streamer | null> {
    return streamerRepository.findById(id);
  },

  listCategories(): Promise<string[]> {
    return streamerRepository.distinctCategories();
  },

  async create(input: StreamerInput): Promise<Streamer> {
    const slug = await resolveUniqueSlug(input.slug, input.name);
    return streamerRepository.create({
      ...toPersistencePayload(input),
      slug,
    });
  },

  async update(id: string, input: StreamerInput): Promise<Streamer> {
    const slug = await resolveUniqueSlug(input.slug, input.name, id);
    return streamerRepository.update(id, {
      ...toPersistencePayload(input),
      slug,
    });
  },

  delete(id: string): Promise<Streamer> {
    return streamerRepository.delete(id);
  },
};
