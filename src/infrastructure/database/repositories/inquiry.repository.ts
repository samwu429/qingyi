import type { JoinInquiry, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for join-us enquiry persistence.
// 「加入我们」留言持久化的数据访问边界。
export const inquiryRepository = {
  create(data: Prisma.JoinInquiryCreateInput): Promise<JoinInquiry> {
    return prisma.joinInquiry.create({ data });
  },

  list(): Promise<JoinInquiry[]> {
    return prisma.joinInquiry.findMany({
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    });
  },

  findById(id: string): Promise<JoinInquiry | null> {
    return prisma.joinInquiry.findUnique({ where: { id } });
  },

  markRead(id: string): Promise<JoinInquiry> {
    return prisma.joinInquiry.update({
      where: { id },
      data: { isRead: true },
    });
  },

  delete(id: string): Promise<JoinInquiry> {
    return prisma.joinInquiry.delete({ where: { id } });
  },

  countUnread(): Promise<number> {
    return prisma.joinInquiry.count({ where: { isRead: false } });
  },
};
