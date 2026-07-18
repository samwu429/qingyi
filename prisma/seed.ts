import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { siteContentRegistry } from "../src/domain/site/site-content.types";

// Idempotent database seed. Provisions the initial administrator from private
// environment references and, when the roster and blog are empty, adds sample
// content so a fresh deployment renders meaningfully. Re-running never
// duplicates data.
// 幂等数据库种子。依据私有环境引用创建初始管理员；当主播名录与博客为空时补充示例内容，
// 使全新部署即有可展示效果。重复执行不会产生重复数据。

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  // Trim env values so accidental spaces in the Render dashboard do not create a
  // credential that never matches what the operator types at login.
  // 去除首尾空格，避免 Render 控制台误粘贴空格导致登录永远对不上。
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    console.warn(
      "Skipping admin seed: ADMIN_USERNAME and ADMIN_PASSWORD are not set.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findUnique({ where: { username } });

  // Upsert so redeploys (or a manual seed) re-sync the password to the current
  // environment variables. Operators often change ADMIN_PASSWORD after the first
  // deploy and expect the new value to work.
  // 使用 upsert：重新部署或手动 seed 时，把密码同步为当前环境变量。
  // 运营常在首次部署后修改 ADMIN_PASSWORD，并期望新密码立即生效。
  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    console.info(`Updated password for admin user "${username}".`);
    return;
  }

  await prisma.adminUser.create({
    data: { username, passwordHash, displayName: "站点管理员" },
  });
  console.info(`Created initial admin user "${username}".`);
}

async function seedStreamers(): Promise<void> {
  const count = await prisma.streamer.count();
  if (count > 0) {
    return;
  }

  await prisma.streamer.createMany({
    data: [
      {
        slug: "lin-xiaoyu",
        name: "林小雨",
        tagline: "治愈系唱见，用歌声陪你度过每个夜晚。",
        bio: "专注于流行与国风翻唱，擅长现场互动，粉丝亲切称为「雨神」。",
        category: "娱乐",
        platform: "抖音",
        tags: ["唱歌", "国风", "才艺"],
        followers: 328000,
        status: "PUBLISHED",
        featured: true,
        sortOrder: 1,
        socials: [],
      },
      {
        slug: "chen-hao",
        name: "陈皓",
        tagline: "热血游戏主播，硬核操作与欢乐并存。",
        bio: "多款热门竞技游戏高分选手，直播风格幽默，团队氛围担当。",
        category: "游戏",
        platform: "B 站",
        tags: ["游戏", "竞技", "娱乐"],
        followers: 156000,
        status: "PUBLISHED",
        featured: true,
        sortOrder: 2,
        socials: [],
      },
      {
        slug: "su-nuan",
        name: "苏暖",
        tagline: "生活方式分享者，带你发现城市的温度。",
        bio: "专注生活、美食与好物分享，风格温柔真实，深受年轻用户喜爱。",
        category: "生活",
        platform: "快手",
        tags: ["生活", "美食", "好物"],
        followers: 89000,
        status: "PUBLISHED",
        featured: true,
        sortOrder: 3,
        socials: [],
      },
    ],
  });
  console.info("Seeded sample streamers.");
}

async function seedPosts(): Promise<void> {
  const count = await prisma.blogPost.count();
  if (count > 0) {
    return;
  }

  const now = new Date();
  await prisma.blogPost.createMany({
    data: [
      {
        slug: "qingyi-media-launch",
        title: "青意传媒启航：做创意内容产业里的创作者陪跑",
        excerpt:
          "从人设真实感、算法可见性到内容 IP 变现，我们把直播公会做成可执行的内容产业陪跑。",
        content:
          "## 我们如何定位\n\n青意传媒面向直播与短视频的创意内容产业，服务创作者孵化、平台分发与商业变现。\n\n平台与技术只是分发层；真正决定结果的，是人设与内容策略、运营组织与可持续变现。\n\n## 我们提供什么\n\n- 人设与真实感运营培训\n- 算法可见性与排播复盘\n- 内容 IP 合作与透明分成\n\n欢迎加入，把个人创意做成可复利的内容事业。",
        author: "青意传媒编辑部",
        tags: ["公告", "公会动态"],
        status: "PUBLISHED",
        publishedAt: now,
      },
      {
        slug: "streamer-growth-guide",
        title: "创作者成长路径：从定位到变现的五个阶段",
        excerpt:
          "把开播拆成可执行阶段：人设定位、内容打磨、算法可见性、粉丝黏性与商业闭环。",
        content:
          "## 阶段一：人设定位\n\n明确内容赛道与可识别的人设标签，避免「什么都播、谁都不记得」。\n\n## 阶段二：内容打磨\n\n固定排播，迭代话术、节奏与镜头真实感。\n\n## 阶段三：算法可见性\n\n结合平台活动与推荐逻辑，做曝光与留存的数据复盘。\n\n## 阶段四：粉丝黏性\n\n把互动经营成持续陪伴关系，沉淀社群与回访。\n\n## 阶段五：内容 IP 变现\n\n对接打赏、品牌与电商，形成可复用的收入结构。",
        author: "青意传媒运营团队",
        tags: ["运营复盘", "创作者成长"],
        status: "PUBLISHED",
        publishedAt: new Date(now.getTime() - 86_400_000),
      },
    ],
  });
  console.info("Seeded sample blog posts.");
}

// Rewrite legacy slugs that still contain Chinese (or other non-ASCII) so
// public detail routes stop 404-ing under percent-encoded URLs.
// 把仍含中文（或其他非 ASCII）的历史 slug 改写为 ASCII，避免前台详情在
// 百分号编码 URL 下持续 404。
function slugifyAscii(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function withSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return slug ? `${slug}-${suffix}` : suffix;
}

async function uniqueAsciiSlug(
  desired: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyAscii(desired) || "item";
  let candidate = base;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!(await exists(candidate))) {
      return candidate;
    }
    candidate = withSuffix(base);
  }
  return withSuffix(base);
}

async function normalizeNonAsciiSlugs(): Promise<void> {
  const nonAscii = /[^\x00-\x7F]/;

  const streamers = await prisma.streamer.findMany({
    select: { id: true, slug: true, name: true },
  });
  for (const streamer of streamers) {
    if (!nonAscii.test(streamer.slug)) {
      continue;
    }
    const nextSlug = await uniqueAsciiSlug(
      slugifyAscii(streamer.slug) || slugifyAscii(streamer.name) || "streamer",
      async (slug) => {
        const hit = await prisma.streamer.findUnique({ where: { slug } });
        return Boolean(hit && hit.id !== streamer.id);
      },
    );
    await prisma.streamer.update({
      where: { id: streamer.id },
      data: { slug: nextSlug },
    });
    console.info(`Normalized streamer slug: ${streamer.slug} → ${nextSlug}`);
  }

  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, title: true },
  });
  for (const post of posts) {
    if (!nonAscii.test(post.slug)) {
      continue;
    }
    const nextSlug = await uniqueAsciiSlug(
      slugifyAscii(post.slug) || slugifyAscii(post.title) || "post",
      async (slug) => {
        const hit = await prisma.blogPost.findUnique({ where: { slug } });
        return Boolean(hit && hit.id !== post.id);
      },
    );
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { slug: nextSlug },
    });
    console.info(`Normalized post slug: ${post.slug} → ${nextSlug}`);
  }
}

// Clear legacy disk upload paths that no longer resolve after Render redeploys.
// Operators must re-upload; leaving broken /uploads URLs only shows broken images.
// 清除 Render 重新部署后已失效的历史本地上传路径。运营需重新上传；
// 保留失效的 /uploads 只会持续显示破图。
function isLegacyDiskUpload(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/uploads/");
}

async function clearLegacyDiskUploads(): Promise<void> {
  const streamers = await prisma.streamer.findMany({
    select: { id: true, avatarUrl: true, coverUrl: true },
  });
  for (const streamer of streamers) {
    const data: { avatarUrl?: null; coverUrl?: null } = {};
    if (isLegacyDiskUpload(streamer.avatarUrl)) {
      data.avatarUrl = null;
    }
    if (isLegacyDiskUpload(streamer.coverUrl)) {
      data.coverUrl = null;
    }
    if (Object.keys(data).length === 0) {
      continue;
    }
    await prisma.streamer.update({ where: { id: streamer.id }, data });
    console.info(`Cleared legacy upload URL on streamer ${streamer.id}`);
  }

  const posts = await prisma.blogPost.findMany({
    select: { id: true, coverUrl: true },
  });
  for (const post of posts) {
    if (!isLegacyDiskUpload(post.coverUrl)) {
      continue;
    }
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { coverUrl: null },
    });
    console.info(`Cleared legacy upload URL on post ${post.id}`);
  }

  const home = await prisma.siteSetting.findUnique({ where: { key: "home" } });
  if (home && home.value && typeof home.value === "object" && !Array.isArray(home.value)) {
    const value = { ...(home.value as Record<string, unknown>) };
    if (isLegacyDiskUpload(value.heroImageUrl as string | undefined)) {
      value.heroImageUrl = "";
      await prisma.siteSetting.update({
        where: { key: "home" },
        data: { value: value as Prisma.InputJsonValue },
      });
      console.info("Cleared legacy heroImageUrl on home settings.");
    }
  }
}

// Push professional site copy into SiteSetting so redeploys refresh public
// pages even when older admin JSON is already stored.
// 把专业站点文案写入 SiteSetting，即使后台已有旧 JSON，重新部署也能刷新前台。
async function syncSiteContentCopy(): Promise<void> {
  for (const key of Object.keys(siteContentRegistry) as Array<
    keyof typeof siteContentRegistry
  >) {
    const value = siteContentRegistry[key].default;
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value as unknown as Prisma.InputJsonValue },
      update: { value: value as unknown as Prisma.InputJsonValue },
    });
  }
  console.info("Synced professional site content copy.");
}

async function refreshSamplePostsCopy(): Promise<void> {
  await prisma.blogPost.updateMany({
    where: { slug: "qingyi-media-launch" },
    data: {
      title: "青意传媒启航：做创意内容产业里的创作者陪跑",
      excerpt:
        "从人设真实感、算法可见性到内容 IP 变现，我们把直播公会做成可执行的内容产业陪跑。",
      content:
        "## 我们如何定位\n\n青意传媒面向直播与短视频的创意内容产业，服务创作者孵化、平台分发与商业变现。\n\n平台与技术只是分发层；真正决定结果的，是人设与内容策略、运营组织与可持续变现。\n\n## 我们提供什么\n\n- 人设与真实感运营培训\n- 算法可见性与排播复盘\n- 内容 IP 合作与透明分成\n\n欢迎加入，把个人创意做成可复利的内容事业。",
      tags: ["公告", "公会动态"],
    },
  });

  await prisma.blogPost.updateMany({
    where: { slug: "streamer-growth-guide" },
    data: {
      title: "创作者成长路径：从定位到变现的五个阶段",
      excerpt:
        "把开播拆成可执行阶段：人设定位、内容打磨、算法可见性、粉丝黏性与商业闭环。",
      content:
        "## 阶段一：人设定位\n\n明确内容赛道与可识别的人设标签，避免「什么都播、谁都不记得」。\n\n## 阶段二：内容打磨\n\n固定排播，迭代话术、节奏与镜头真实感。\n\n## 阶段三：算法可见性\n\n结合平台活动与推荐逻辑，做曝光与留存的数据复盘。\n\n## 阶段四：粉丝黏性\n\n把互动经营成持续陪伴关系，沉淀社群与回访。\n\n## 阶段五：内容 IP 变现\n\n对接打赏、品牌与电商，形成可复用的收入结构。",
      tags: ["运营复盘", "创作者成长"],
    },
  });
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedStreamers();
  await seedPosts();
  await refreshSamplePostsCopy();
  await syncSiteContentCopy();
  await normalizeNonAsciiSlugs();
  await clearLegacyDiskUploads();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
