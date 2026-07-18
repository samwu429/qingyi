import { z } from "zod";

// Validation for public join-us enquiry submissions. Name and contact are
// required so the team can follow up; the free-form message is optional.
// 前台「加入我们」留言校验：姓名与联系方式必填以便跟进，留言正文可选。
export const joinInquiryInputSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名").max(60),
  contact: z
    .string()
    .trim()
    .min(1, "请填写联系方式")
    .max(120, "联系方式过长"),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type JoinInquiryInput = z.infer<typeof joinInquiryInputSchema>;
