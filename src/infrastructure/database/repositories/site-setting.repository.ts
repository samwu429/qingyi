import type { Prisma, SiteSetting } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for the key/value site settings store.
// 键值站点设置存储的数据访问边界。
export const siteSettingRepository = {
  find(key: string): Promise<SiteSetting | null> {
    return prisma.siteSetting.findUnique({ where: { key } });
  },

  upsert(key: string, value: Prisma.InputJsonValue): Promise<SiteSetting> {
    return prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  },
};
