import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
        title: "青意传媒正式启航：与每一位主播共同成长",
        excerpt: "我们相信内容的力量，也相信每一位创作者的潜力。",
        content:
          "## 我们为何出发\n\n青意传媒成立于福建福清，专注主播孵化与直播内容运营。\n\n我们提供从人设定位、内容策划到流量投放的一站式服务，帮助主播把热爱变成事业。\n\n## 我们能提供什么\n\n- 专业的运营与中控团队\n- 多平台资源对接\n- 透明的分成与保底机制\n\n欢迎加入我们，一起点亮属于你的高光时刻。",
        author: "青意传媒编辑部",
        tags: ["公告", "公会动态"],
        status: "PUBLISHED",
        publishedAt: now,
      },
      {
        slug: "streamer-growth-guide",
        title: "新人主播成长指南：从零到稳定开播的五个阶段",
        excerpt: "起号难？我们把主播成长拆解为清晰可执行的五个阶段。",
        content:
          "## 阶段一：定位\n\n明确你的内容方向与人设标签。\n\n## 阶段二：内容打磨\n\n固定开播时间，持续优化话术与节奏。\n\n## 阶段三：流量起量\n\n结合平台活动与站内推荐，稳步扩大曝光。\n\n## 阶段四：粉丝沉淀\n\n通过社群与互动增强粉丝黏性。\n\n## 阶段五：商业变现\n\n对接广告、电商与打赏，构建稳定收入结构。",
        author: "青意传媒运营团队",
        tags: ["主播故事", "运营干货"],
        status: "PUBLISHED",
        publishedAt: new Date(now.getTime() - 86_400_000),
      },
    ],
  });
  console.info("Seeded sample blog posts.");
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedStreamers();
  await seedPosts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
