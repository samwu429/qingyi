import type { Prisma } from "@prisma/client";
import { siteSettingRepository } from "@/infrastructure/database/repositories/site-setting.repository";
import {
  siteContentRegistry,
  type AboutContent,
  type HomeContent,
  type JoinContent,
  type SiteContentKey,
} from "@/domain/site/site-content.types";
import { stripAutoManagedHomeStats } from "@/domain/site/home-live-stats";

// Drop blank repeatable rows so an accidental "add" in the admin editors does
// not persist empty cards or create duplicate React keys on the public site.
// 丢弃空白的可重复行，避免后台误点「添加」后把空卡片持久化，
// 或在前台产生重复 React key。
function sanitizeContent<K extends SiteContentKey>(
  key: K,
  value: (typeof siteContentRegistry)[K]["default"],
): (typeof siteContentRegistry)[K]["default"] {
  if (key === "home") {
    const home = value as HomeContent;
    return {
      ...home,
      // Drop auto stats so CMS never re-stores values that front always computes.
      // 去掉自动统计项，避免 CMS 再存一份前台本就会实时计算的数值。
      stats: stripAutoManagedHomeStats(
        home.stats.filter((item) => item.label.trim() || item.value.trim()),
      ),
      highlights: home.highlights.filter(
        (item) => item.title.trim() || item.description.trim(),
      ),
    } as (typeof siteContentRegistry)[K]["default"];
  }

  if (key === "about") {
    const about = value as AboutContent;
    return {
      ...about,
      sections: about.sections.filter(
        (item) => item.title.trim() || item.body.trim(),
      ),
    } as (typeof siteContentRegistry)[K]["default"];
  }

  if (key === "join") {
    const join = value as JoinContent;
    return {
      ...join,
      benefits: join.benefits.filter(
        (item) => item.title.trim() || item.description.trim(),
      ),
      requirements: join.requirements.filter((item) => item.trim()),
      steps: join.steps.filter(
        (item) => item.title.trim() || item.description.trim(),
      ),
    } as (typeof siteContentRegistry)[K]["default"];
  }

  return value;
}

// Read/write editable page content. Reads merge stored overrides on top of the
// typed defaults and re-validate, so malformed or partial records degrade
// gracefully to a valid shape rather than breaking the public site.
// 读写可编辑页面内容：读取时在类型化默认值之上合并已存储覆盖值并重新校验，
// 使残缺或非法记录优雅回退为合法结构，而非导致前台崩溃。
export const siteContentService = {
  async get<K extends SiteContentKey>(
    key: K,
  ): Promise<(typeof siteContentRegistry)[K]["default"]> {
    const entry = siteContentRegistry[key];
    try {
      const stored = await siteSettingRepository.find(key);
      if (!stored) {
        return entry.default;
      }

      const merged = {
        ...entry.default,
        ...(stored.value as Record<string, unknown>),
      };
      const parsed = entry.schema.safeParse(merged);
      const value = (
        parsed.success ? parsed.data : entry.default
      ) as (typeof siteContentRegistry)[K]["default"];
      return sanitizeContent(key, value);
    } catch {
      // DB unreachable (e.g. local Postgres down) — keep the public site up.
      // 数据库不可达（如本地 Postgres 未启动）时回退默认文案，避免前台整页崩溃。
      return entry.default;
    }
  },

  async save<K extends SiteContentKey>(
    key: K,
    value: (typeof siteContentRegistry)[K]["default"],
  ): Promise<void> {
    const entry = siteContentRegistry[key];
    const validated = entry.schema.parse(sanitizeContent(key, value));
    await siteSettingRepository.upsert(
      key,
      validated as unknown as Prisma.InputJsonValue,
    );
  },
};
