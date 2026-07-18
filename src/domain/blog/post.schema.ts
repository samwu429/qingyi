import { z } from "zod";
import { optionalUrlSchema } from "@/domain/shared/url.schema";

// Validation contract for blog post create/update operations, enforced at the
// server-action trust boundary before persistence.
// 博客文章创建/更新的校验契约，在服务端 action 信任边界持久化前强制执行。

export const postStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "请填写文章标题").max(150),
  slug: z
    .string()
    .trim()
    .max(180)
    .regex(/^[a-z0-9-]*$/, "Slug 只能含英文、数字和连字符")
    .optional()
    .or(z.literal("")),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(1, "请填写文章正文"),
  coverUrl: optionalUrlSchema,
  author: z.string().trim().max(60).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(24)).max(12).default([]),
  status: z.enum(postStatusValues).default("DRAFT"),
});

export type PostInput = z.infer<typeof postInputSchema>;
