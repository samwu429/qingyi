import { z } from "zod";
import { optionalUrlSchema } from "@/domain/shared/url.schema";
import { optionalAsciiSlugSchema } from "@/domain/shared/slug.schema";

// Validation contract for streamer create/update operations. Applied at the
// trust boundary (server actions) before any persistence occurs.
// 主播创建/更新操作的校验契约，在信任边界（服务端 action）持久化之前应用。

const socialLinkSchema = z.object({
  label: z.string().trim().min(1, "请填写社交平台名称").max(30),
  url: z.url("请填写有效的社交链接（需以 https:// 开头）"),
});

export const streamerStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const streamerBioFormatValues = ["MARKDOWN", "HTML"] as const;

export const streamerInputSchema = z.object({
  name: z.string().trim().min(1, "请填写主播名称").max(60),
  slug: optionalAsciiSlugSchema(80),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  // Same authoring envelope as blog posts — no tight max so HTML embeds fit.
  // 与资讯正文同级容量，便于 HTML 嵌入长图 / PDF。
  bio: z.string().trim().max(200_000).optional().or(z.literal("")),
  bioFormat: z.enum(streamerBioFormatValues).default("MARKDOWN"),
  avatarUrl: optionalUrlSchema,
  coverUrl: optionalUrlSchema,
  platform: z.string().trim().max(40).optional().or(z.literal("")),
  platformUrl: optionalUrlSchema,
  category: z.string().trim().max(40).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(24)).max(12).default([]),
  followers: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number().int().min(0).max(1_000_000_000),
  ),
  socials: z.array(socialLinkSchema).max(8).default([]),
  status: z.enum(streamerStatusValues).default("PUBLISHED"),
  featured: z.coerce.boolean().default(false),
  sortOrder: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number().int().min(0).max(100000),
  ),
});

export type StreamerInput = z.infer<typeof streamerInputSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
