import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { GroqToolDefinition } from "@/infrastructure/ai/groq";
import { streamerService } from "@/domain/streamers/streamer.service";
import {
  streamerInputSchema,
  type SocialLink,
} from "@/domain/streamers/streamer.schema";
import { postService } from "@/domain/blog/post.service";
import { postInputSchema } from "@/domain/blog/post.schema";
import { metricService } from "@/domain/metrics/metric.service";
import { metricInputSchema } from "@/domain/metrics/metric.schema";
import { inquiryService } from "@/domain/inquiries/inquiry.service";
import { siteContentService } from "@/domain/site/site-content.service";
import {
  siteContentRegistry,
  type SiteContentKey,
} from "@/domain/site/site-content.types";

// Tool registry for the admin operations assistant. Every mutation goes through
// existing domain services + Zod schemas — never raw SQL.
// 后台运营助手的工具注册表。所有变更均经现有 domain 服务与 Zod 校验，禁止裸 SQL。

export interface AdminToolAction {
  tool: string;
  summary: string;
  ok: boolean;
}

export interface AdminToolContext {
  /** Set true only after the user explicitly confirms a destructive action. */
  deleteConfirmed: boolean;
  actions: AdminToolAction[];
}

type ToolHandler = (
  args: Record<string, unknown>,
  ctx: AdminToolContext,
) => Promise<unknown>;

function revalidateStreamerSurfaces(slug?: string, streamerId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/streamers");
  revalidatePath("/streamers");
  revalidatePath("/");
  if (streamerId) {
    revalidatePath(`/admin/streamers/${streamerId}/edit`);
  }
  if (slug) {
    revalidatePath(`/streamers/${slug}`);
  }
}

function revalidatePostSurfaces(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

function record(
  ctx: AdminToolContext,
  tool: string,
  summary: string,
  ok: boolean,
) {
  ctx.actions.push({ tool, summary, ok });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

const siteKeys = Object.keys(siteContentRegistry) as SiteContentKey[];

export const adminToolDefinitions: GroqToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_admin_stats",
      description: "获取后台概览：主播数、资讯数、未读留言、运营数据汇总",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_streamers",
      description: "列出所有主播（含 id/name/slug/粉丝/状态），写运营数据前必须先调用以对齐名字",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_streamer",
      description: "按 id 获取单个主播详情",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_streamer",
      description: "创建主播档案",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          tagline: { type: "string" },
          bio: { type: "string" },
          bioFormat: { type: "string", enum: ["MARKDOWN", "HTML"] },
          avatarUrl: { type: "string" },
          coverUrl: { type: "string" },
          platform: { type: "string" },
          platformUrl: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          followers: { type: "number" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          featured: { type: "boolean" },
          sortOrder: { type: "number" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_streamer",
      description: "更新主播（只传要改的字段 + id；未传字段保留原值）",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          tagline: { type: "string" },
          bio: { type: "string" },
          bioFormat: { type: "string", enum: ["MARKDOWN", "HTML"] },
          avatarUrl: { type: "string" },
          coverUrl: { type: "string" },
          platform: { type: "string" },
          platformUrl: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          followers: { type: "number" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          featured: { type: "boolean" },
          sortOrder: { type: "number" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_metric",
      description:
        "为指定主播写入一条运营数据。income 为人民币元整数；liveMinutes 为开播分钟；yinlang 为收获音浪。写入后会同步前台粉丝数。",
      parameters: {
        type: "object",
        properties: {
          streamerId: { type: "string" },
          period: { type: "string", description: "如 2026-07 或 本周" },
          followers: { type: "number" },
          income: { type: "number", description: "直播收入，整数元" },
          liveMinutes: { type: "number", description: "开播时长（分钟）" },
          viewers: { type: "number", description: "观众人数" },
          comments: { type: "number", description: "评论人数" },
          likes: { type: "number", description: "点赞次数" },
          yinlang: { type: "number", description: "收获音浪" },
          note: { type: "string" },
          recordedAt: { type: "string", description: "ISO 日期，可选" },
        },
        required: ["streamerId", "period", "followers"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_streamer_metrics",
      description: "列出某主播的运营数据历史",
      parameters: {
        type: "object",
        properties: { streamerId: { type: "string" } },
        required: ["streamerId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_metric",
      description:
        "删除一条运营数据。危险操作：仅当用户已明确说「确认删除」且 confirm=true 时才执行",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          confirm: { type: "boolean" },
        },
        required: ["id", "confirm"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_posts",
      description: "列出资讯文章摘要",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "create_post",
      description: "创建资讯文章",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          format: { type: "string", enum: ["MARKDOWN", "HTML"] },
          coverUrl: { type: "string" },
          author: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_post",
      description: "更新资讯（只传要改的字段 + id）",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          format: { type: "string", enum: ["MARKDOWN", "HTML"] },
          coverUrl: { type: "string" },
          author: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_inquiries",
      description: "列出「加入我们」留言",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_inquiry_read",
      description: "将留言标为已读",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_site_content",
      description: "读取可编辑站点页面内容（home/about/join/contact）",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", enum: siteKeys },
        },
        required: ["key"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_site_content",
      description: "完整覆盖保存某页站点内容 JSON（须符合该页 schema）",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", enum: siteKeys },
          content: { type: "object" },
        },
        required: ["key", "content"],
        additionalProperties: false,
      },
    },
  },
];

const handlers: Record<string, ToolHandler> = {
  async get_admin_stats() {
    const [streamers, posts, unread, dashboard] = await Promise.all([
      streamerService.stats(),
      postService.stats(),
      inquiryService.countUnread(),
      metricService.getDashboard(),
    ]);
    return {
      streamers,
      posts,
      unreadInquiries: unread,
      metrics: dashboard.totals,
    };
  },

  async list_streamers() {
    const items = await streamerService.listAllForAdmin();
    return items.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      platform: s.platform,
      followers: s.followers,
      status: s.status,
      featured: s.featured,
      tagline: s.tagline,
    }));
  },

  async get_streamer(args) {
    const id = z.string().min(1).parse(args.id);
    const streamer = await streamerService.getById(id);
    if (!streamer) {
      return { error: "主播不存在" };
    }
    return streamer;
  },

  async create_streamer(args, ctx) {
    const parsed = streamerInputSchema.safeParse(args);
    if (!parsed.success) {
      record(ctx, "create_streamer", "创建主播失败：校验未通过", false);
      return { error: parsed.error.issues.map((i) => i.message).join("；") };
    }
    const streamer = await streamerService.create(parsed.data);
    revalidateStreamerSurfaces(streamer.slug, streamer.id);
    record(ctx, "create_streamer", `已创建主播「${streamer.name}」`, true);
    return { id: streamer.id, name: streamer.name, slug: streamer.slug };
  },

  async update_streamer(args, ctx) {
    const id = z.string().min(1).parse(args.id);
    const existing = await streamerService.getById(id);
    if (!existing) {
      record(ctx, "update_streamer", "更新主播失败：不存在", false);
      return { error: "主播不存在" };
    }
    const patch = asRecord(args);
    delete patch.id;
    const socials: SocialLink[] = Array.isArray(existing.socials)
      ? existing.socials.filter(
          (item): item is SocialLink =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as SocialLink).label === "string" &&
            typeof (item as SocialLink).url === "string",
        )
      : [];
    const merged = streamerInputSchema.safeParse({
      name: patch.name ?? existing.name,
      slug: patch.slug ?? existing.slug,
      tagline: patch.tagline ?? existing.tagline ?? "",
      bio: patch.bio ?? existing.bio ?? "",
      bioFormat: patch.bioFormat ?? existing.bioFormat,
      avatarUrl: patch.avatarUrl ?? existing.avatarUrl ?? "",
      coverUrl: patch.coverUrl ?? existing.coverUrl ?? "",
      platform: patch.platform ?? existing.platform ?? "",
      platformUrl: patch.platformUrl ?? existing.platformUrl ?? "",
      category: patch.category ?? existing.category ?? "",
      tags: patch.tags ?? existing.tags,
      followers: patch.followers ?? existing.followers,
      socials,
      status: patch.status ?? existing.status,
      featured: patch.featured ?? existing.featured,
      sortOrder: patch.sortOrder ?? existing.sortOrder,
    });
    if (!merged.success) {
      record(ctx, "update_streamer", "更新主播失败：校验未通过", false);
      return { error: merged.error.issues.map((i) => i.message).join("；") };
    }
    const streamer = await streamerService.update(id, merged.data);
    revalidateStreamerSurfaces(streamer.slug, streamer.id);
    record(ctx, "update_streamer", `已更新主播「${streamer.name}」`, true);
    return { id: streamer.id, name: streamer.name, slug: streamer.slug };
  },

  async create_metric(args, ctx) {
    const parsed = metricInputSchema.safeParse(args);
    if (!parsed.success) {
      record(ctx, "create_metric", "写入运营数据失败：校验未通过", false);
      return { error: parsed.error.issues.map((i) => i.message).join("；") };
    }
    const streamer = await streamerService.getById(parsed.data.streamerId);
    if (!streamer) {
      record(ctx, "create_metric", "写入运营数据失败：主播不存在", false);
      return { error: "主播不存在" };
    }
    const metric = await metricService.create(parsed.data);
    revalidateStreamerSurfaces(streamer.slug, streamer.id);
    record(
      ctx,
      "create_metric",
      `已写入「${streamer.name}」${metric.period}：粉丝 ${metric.followers}，收入 ¥${metric.income}，开播 ${metric.liveMinutes} 分，观众 ${metric.viewers}，评论 ${metric.comments}，点赞 ${metric.likes}，音浪 ${metric.yinlang}`,
      true,
    );
    return {
      id: metric.id,
      streamerName: streamer.name,
      period: metric.period,
      followers: metric.followers,
      income: metric.income,
      liveMinutes: metric.liveMinutes,
      viewers: metric.viewers,
      comments: metric.comments,
      likes: metric.likes,
      yinlang: metric.yinlang,
    };
  },

  async list_streamer_metrics(args) {
    const streamerId = z.string().min(1).parse(args.streamerId);
    return metricService.getStreamerHistory(streamerId);
  },

  async delete_metric(args, ctx) {
    const id = z.string().min(1).parse(args.id);
    const confirm = Boolean(args.confirm);
    if (!confirm || !ctx.deleteConfirmed) {
      record(
        ctx,
        "delete_metric",
        "未删除：需要用户明确说「确认删除」且 confirm=true",
        false,
      );
      return {
        error:
          "删除未执行。请先向用户确认；用户回复「确认删除」后，再以 confirm=true 调用。",
      };
    }
    const metric = await metricService.delete(id);
    if (!metric) {
      record(ctx, "delete_metric", "删除失败：记录不存在", false);
      return { error: "记录不存在" };
    }
    const streamer = await streamerService.getById(metric.streamerId);
    revalidateStreamerSurfaces(streamer?.slug, metric.streamerId);
    record(
      ctx,
      "delete_metric",
      `已删除运营数据 ${metric.period}（粉丝 ${metric.followers}）`,
      true,
    );
    return { ok: true, id: metric.id };
  },

  async list_posts() {
    const items = await postService.listAllForAdmin();
    return items.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      format: p.format,
      tags: p.tags,
      publishedAt: p.publishedAt,
      excerpt: p.excerpt,
    }));
  },

  async create_post(args, ctx) {
    const parsed = postInputSchema.safeParse(args);
    if (!parsed.success) {
      record(ctx, "create_post", "创建资讯失败：校验未通过", false);
      return { error: parsed.error.issues.map((i) => i.message).join("；") };
    }
    const post = await postService.create(parsed.data);
    revalidatePostSurfaces(post.slug);
    record(ctx, "create_post", `已创建资讯「${post.title}」`, true);
    return { id: post.id, title: post.title, slug: post.slug, status: post.status };
  },

  async update_post(args, ctx) {
    const id = z.string().min(1).parse(args.id);
    const existing = await postService.getById(id);
    if (!existing) {
      record(ctx, "update_post", "更新资讯失败：不存在", false);
      return { error: "资讯不存在" };
    }
    const patch = asRecord(args);
    delete patch.id;
    const merged = postInputSchema.safeParse({
      title: patch.title ?? existing.title,
      slug: patch.slug ?? existing.slug,
      excerpt: patch.excerpt ?? existing.excerpt ?? "",
      content: patch.content ?? existing.content,
      format: patch.format ?? existing.format,
      coverUrl: patch.coverUrl ?? existing.coverUrl ?? "",
      author: patch.author ?? existing.author ?? "",
      tags: patch.tags ?? existing.tags,
      status: patch.status ?? existing.status,
    });
    if (!merged.success) {
      record(ctx, "update_post", "更新资讯失败：校验未通过", false);
      return { error: merged.error.issues.map((i) => i.message).join("；") };
    }
    const post = await postService.update(id, merged.data);
    revalidatePostSurfaces(post.slug);
    record(ctx, "update_post", `已更新资讯「${post.title}」`, true);
    return { id: post.id, title: post.title, slug: post.slug, status: post.status };
  },

  async list_inquiries() {
    const items = await inquiryService.listForAdmin();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      contact: item.contact,
      message: item.message,
      isRead: item.isRead,
      createdAt: item.createdAt,
    }));
  },

  async mark_inquiry_read(args, ctx) {
    const id = z.string().min(1).parse(args.id);
    const inquiry = await inquiryService.markRead(id);
    revalidatePath("/admin");
    revalidatePath("/admin/inquiries");
    record(ctx, "mark_inquiry_read", `已将留言「${inquiry.name}」标为已读`, true);
    return { id: inquiry.id, name: inquiry.name, isRead: inquiry.isRead };
  },

  async get_site_content(args) {
    const key = z.enum(siteKeys as [SiteContentKey, ...SiteContentKey[]]).parse(args.key);
    const content = await siteContentService.get(key);
    return { key, content };
  },

  async update_site_content(args, ctx) {
    const key = z.enum(siteKeys as [SiteContentKey, ...SiteContentKey[]]).parse(args.key);
    const entry = siteContentRegistry[key];
    const parsed = entry.schema.safeParse(args.content);
    if (!parsed.success) {
      record(ctx, "update_site_content", `更新页面 ${key} 失败：校验未通过`, false);
      return { error: parsed.error.issues.map((i) => i.message).join("；") };
    }
    await siteContentService.save(
      key,
      parsed.data as (typeof siteContentRegistry)[typeof key]["default"],
    );
    revalidatePath("/admin/pages");
    revalidatePath("/");
    if (key === "about") revalidatePath("/about");
    if (key === "join") revalidatePath("/join");
    if (key === "contact") revalidatePath("/contact");
    record(ctx, "update_site_content", `已更新站点页面「${key}」`, true);
    return { ok: true, key };
  },
};

export async function executeAdminTool(
  name: string,
  rawArgs: string,
  ctx: AdminToolContext,
): Promise<string> {
  const handler = handlers[name];
  if (!handler) {
    record(ctx, name, `未知工具：${name}`, false);
    return JSON.stringify({ error: `未知工具：${name}` });
  }

  let args: Record<string, unknown> = {};
  try {
    args = asRecord(JSON.parse(rawArgs || "{}"));
  } catch {
    record(ctx, name, "参数 JSON 无法解析", false);
    return JSON.stringify({ error: "工具参数不是合法 JSON" });
  }

  try {
    const result = await handler(args, ctx);
    return JSON.stringify(result ?? { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "工具执行失败";
    record(ctx, name, `${name} 失败：${message}`, false);
    return JSON.stringify({ error: message });
  }
}
