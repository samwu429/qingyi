import { z } from "zod";
import { siteConfig } from "@/config/site.config";

// Typed schema and defaults for administrator-editable page content. Each key in
// the SiteSetting store maps to one section below. Defaults render immediately on
// a fresh deployment before any customisation.
// 管理员可编辑页面内容的类型化 schema 与默认值。SiteSetting 存储中的每个键对应下方一个区块；
// 全新部署且未定制时直接渲染默认值。

const statItemSchema = z.object({
  label: z.string().trim().max(40),
  value: z.string().trim().max(40),
});

const highlightItemSchema = z.object({
  title: z.string().trim().max(60),
  description: z.string().trim().max(240),
});

export const homeContentSchema = z.object({
  heroTitle: z.string().trim().max(120),
  heroSubtitle: z.string().trim().max(400),
  heroCtaLabel: z.string().trim().max(30),
  heroCtaHref: z.string().trim().max(120),
  heroSecondaryLabel: z.string().trim().max(30),
  heroSecondaryHref: z.string().trim().max(120),
  heroImageUrl: z.string().trim().max(500),
  stats: z.array(statItemSchema).max(8),
  highlights: z.array(highlightItemSchema).max(8),
});

export const aboutContentSchema = z.object({
  intro: z.string().trim().max(4000),
  sections: z
    .array(
      z.object({
        title: z.string().trim().max(60),
        body: z.string().trim().max(2000),
      }),
    )
    .max(10),
});

export const contactContentSchema = z.object({
  intro: z.string().trim().max(600),
  address: z.string().trim().max(200),
  email: z.string().trim().max(120),
  phone: z.string().trim().max(60),
  wechat: z.string().trim().max(60),
  weibo: z.string().trim().max(120),
});

export const joinContentSchema = z.object({
  intro: z.string().trim().max(1000),
  benefits: z.array(highlightItemSchema).max(10),
  requirements: z.array(z.string().trim().max(200)).max(12),
  steps: z.array(highlightItemSchema).max(10),
  contactNote: z.string().trim().max(400),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
export type AboutContent = z.infer<typeof aboutContentSchema>;
export type ContactContent = z.infer<typeof contactContentSchema>;
export type JoinContent = z.infer<typeof joinContentSchema>;

// Registry binding each settings key to its schema and default value. The single
// source of truth consumed by the service, admin forms, and public pages.
// 将每个设置键绑定到其 schema 与默认值的注册表，作为服务、后台表单与前台页面共用的唯一事实来源。
export const siteContentRegistry = {
  home: {
    schema: homeContentSchema,
    default: {
      heroTitle: "点亮每一位主播的高光时刻",
      heroSubtitle:
        "青意传媒专注主播孵化与直播内容运营，以专业培训、流量扶持与商业变现，助力主播稳步成长为头部创作者。",
      heroCtaLabel: "加入公会",
      heroCtaHref: "/join",
      heroSecondaryLabel: "查看主播",
      heroSecondaryHref: "/streamers",
      heroImageUrl: "",
      stats: [
        { label: "签约主播", value: "120+" },
        { label: "月均开播时长", value: "8000h" },
        { label: "合作平台", value: "10+" },
        { label: "年度流水增长", value: "260%" },
      ],
      highlights: [
        {
          title: "专业孵化体系",
          description:
            "从人设定位、话术打磨到镜头表现，提供全流程培训与一对一陪跑。",
        },
        {
          title: "全域流量扶持",
          description:
            "对接多平台官方资源与站内推荐位，帮助主播快速起量与破圈。",
        },
        {
          title: "商业变现闭环",
          description:
            "整合品牌广告、电商带货与直播打赏，构建可持续的收入结构。",
        },
      ],
    } satisfies HomeContent,
  },
  about: {
    schema: aboutContentSchema,
    default: {
      intro:
        `${siteConfig.brandName}（${siteConfig.companyLegalName}）是一家专注于主播孵化与直播内容运营的传媒公会。` +
        "我们以内容为核心，以数据为驱动，为主播提供从起步到成熟的全周期成长服务。",
      sections: [
        {
          title: "我们的使命",
          body: "发现并培养有潜力的主播，用专业与真诚陪伴每一位创作者成长，共同打造健康、正向、可持续的直播生态。",
        },
        {
          title: "我们的优势",
          body: "成熟的运营方法论、多平台资源矩阵、专业的中控与投流团队，以及透明的分成机制，让主播专注创作、无后顾之忧。",
        },
      ],
    } satisfies AboutContent,
  },
  contact: {
    schema: contactContentSchema,
    default: {
      intro: "无论是商务合作还是主播签约，欢迎通过以下方式与我们取得联系。",
      address: siteConfig.contact.address,
      email: siteConfig.contact.email,
      phone: "",
      wechat: "",
      weibo: "",
    } satisfies ContactContent,
  },
  join: {
    schema: joinContentSchema,
    default: {
      intro:
        "无论你是新人还是成熟主播，只要热爱直播、愿意成长，青意传媒都为你准备了完善的扶持与培养计划。",
      benefits: [
        {
          title: "保底与分成",
          description: "提供有竞争力的保底方案与阶梯分成，多劳多得，收入透明。",
        },
        {
          title: "专属运营团队",
          description: "配备中控、场控与投流团队，全程协助排播与数据优化。",
        },
        {
          title: "系统化培训",
          description: "定期开展话术、才艺与镜头表现培训，助力快速提升。",
        },
      ],
      requirements: [
        "年满 18 周岁，热爱直播行业",
        "具备一定的表达能力或才艺特长",
        "每周可保证稳定的开播时长",
        "认同公会价值观，愿意长期合作",
      ],
      steps: [
        { title: "在线报名", description: "填写下方联系方式或投递资料。" },
        { title: "面试沟通", description: "运营团队评估方向与匹配度。" },
        { title: "签约培训", description: "确定方案，进入孵化培训阶段。" },
        { title: "正式开播", description: "团队陪跑，稳步起量。" },
      ],
      contactNote: "报名请联系公会招募负责人，或前往联系我们页面留言。",
    } satisfies JoinContent,
  },
} as const;

export type SiteContentKey = keyof typeof siteContentRegistry;
