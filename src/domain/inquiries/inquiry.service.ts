import type { JoinInquiry } from "@prisma/client";
import { inquiryRepository } from "@/infrastructure/database/repositories/inquiry.repository";
import type { JoinInquiryInput } from "@/domain/inquiries/inquiry.schema";

// Application services for recruitment enquiries submitted on the join page.
// 「加入我们」页招募留言的应用服务。
function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const inquiryService = {
  create(input: JoinInquiryInput): Promise<JoinInquiry> {
    return inquiryRepository.create({
      name: input.name.trim(),
      contact: input.contact.trim(),
      message: emptyToNull(input.message),
    });
  },

  listForAdmin(): Promise<JoinInquiry[]> {
    return inquiryRepository.list();
  },

  getById(id: string): Promise<JoinInquiry | null> {
    return inquiryRepository.findById(id);
  },

  markRead(id: string): Promise<JoinInquiry> {
    return inquiryRepository.markRead(id);
  },

  delete(id: string): Promise<JoinInquiry> {
    return inquiryRepository.delete(id);
  },

  countUnread(): Promise<number> {
    return inquiryRepository.countUnread();
  },
};
