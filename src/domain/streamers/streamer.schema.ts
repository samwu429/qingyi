import { z } from "zod";

// Validation contract for streamer create/update operations. Applied at the
// trust boundary (server actions) before any persistence occurs.
// 主播创建/更新操作的校验契约，在信任边界（服务端 action）持久化之前应用。
const optionalUrl = z
  .union([z.literal(""), z.url("请填写有效的链接地址")])
  .optional();

const socialLinkSchema = z.object({
  label: z.string().trim().min(1).max(30),
  url: z.url("请填写有效的社交链接"),
});

export const streamerStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const streamerInputSchema = z.object({
  name: z.string().trim().min(1, "请填写主播名称").max(60),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(4000).optional().or(z.literal("")),
  avatarUrl: optionalUrl,
  coverUrl: optionalUrl,
  platform: z.string().trim().max(40).optional().or(z.literal("")),
  platformUrl: optionalUrl,
  category: z.string().trim().max(40).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(24)).max(12).default([]),
  followers: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  socials: z.array(socialLinkSchema).max(8).default([]),
  status: z.enum(streamerStatusValues).default("PUBLISHED"),
  featured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export type StreamerInput = z.infer<typeof streamerInputSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
