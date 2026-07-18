import type { Prisma } from "@prisma/client";
import { siteSettingRepository } from "@/infrastructure/database/repositories/site-setting.repository";
import {
  siteContentRegistry,
  type SiteContentKey,
} from "@/domain/site/site-content.types";

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
    const stored = await siteSettingRepository.find(key);
    if (!stored) {
      return entry.default;
    }

    const merged = {
      ...entry.default,
      ...(stored.value as Record<string, unknown>),
    };
    const parsed = entry.schema.safeParse(merged);
    return (
      parsed.success ? parsed.data : entry.default
    ) as (typeof siteContentRegistry)[K]["default"];
  },

  async save<K extends SiteContentKey>(
    key: K,
    value: (typeof siteContentRegistry)[K]["default"],
  ): Promise<void> {
    const entry = siteContentRegistry[key];
    const validated = entry.schema.parse(value);
    await siteSettingRepository.upsert(
      key,
      validated as unknown as Prisma.InputJsonValue,
    );
  },
};
