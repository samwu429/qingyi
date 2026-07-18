import { PrismaClient } from "@prisma/client";

// Reuse a single Prisma client across hot reloads in development to avoid
// exhausting database connections. In production a fresh instance is created
// once per server process.
// 在开发环境热重载间复用同一个 Prisma 客户端，防止耗尽数据库连接；生产环境每个进程仅创建一次。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
