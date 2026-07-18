import type { AdminUser, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for administrator accounts.
// 管理员账户的数据访问边界。
export const adminUserRepository = {
  findByUsername(username: string): Promise<AdminUser | null> {
    return prisma.adminUser.findUnique({ where: { username } });
  },

  findById(id: string): Promise<AdminUser | null> {
    return prisma.adminUser.findUnique({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.adminUser.count();
  },

  create(data: Prisma.AdminUserCreateInput): Promise<AdminUser> {
    return prisma.adminUser.create({ data });
  },

  updatePassword(id: string, passwordHash: string): Promise<AdminUser> {
    return prisma.adminUser.update({ where: { id }, data: { passwordHash } });
  },
};
