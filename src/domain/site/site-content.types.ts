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
// Copy borrows useful industry vocabulary from media / platform studies
// (creative industries, algorithmic visibility, authenticity, parasocial bonds)
// and keeps it operational — no unused academic filler.
// 将每个设置键绑定到其 schema 与默认值的注册表。文案吸收媒介与平台研究中真正有用的行业术语
//（创意产业、算法可见性、真实感人设、准社会关系），只保留可落地表述。
export const siteContentRegistry = {
  home: {
    schema: homeContentSchema,
    default: {
      heroTitle: "把个人创意做成可持续的内容事业",
      heroSubtitle:
        "青意传媒深耕创意内容产业：从人设与真实感运营、内容 IP 打磨，到算法可见性提升与平台分发变现，陪创作者完成从开播到商业闭环。",
      heroCtaLabel: "申请加入",
      heroCtaHref: "/join",
      heroSecondaryLabel: "浏览创作者",
      heroSecondaryHref: "/streamers",
      heroImageUrl: "",
      stats: [
        { label: "签约创作者", value: "120+" },
        { label: "月均开播时长", value: "8000h" },
        { label: "覆盖内容平台", value: "10+" },
        { label: "内容 IP 合作", value: "持续增长" },
      ],
      highlights: [
        {
          title: "人设与真实感运营",
          description:
            "把「真实、可共鸣」当作可训练的内容能力：定位人设、镜头表达与互动话术，让粉丝关系从围观走向持续陪伴。",
        },
        {
          title: "算法可见性与分发",
          description:
            "围绕平台推荐逻辑做内容与排播优化，提升曝光与留存，而不是只靠偶然流量。",
        },
        {
          title: "内容 IP 与商业变现",
          description:
            "打通直播打赏、品牌合作与电商带货，把创意与技能转化为可持续的知识产权与收入结构。",
        },
      ],
    } satisfies HomeContent,
  },
  about: {
    schema: aboutContentSchema,
    default: {
      intro:
        `${siteConfig.brandName}（${siteConfig.companyLegalName}）是一家面向直播与短视频的创意内容公会。` +
        "我们不只提供「开播工具」，而是把平台规则、内容生产与受众关系放在同一套体系里：帮助创作者建立可识别的人设品牌，提升算法可见性，并形成可复用的内容 IP 与变现路径。",
      sections: [
        {
          title: "我们如何看内容",
          body: "直播与短视频属于参与式内容生态：观众既是受众，也是互动与传播的参与者。公会的工作是协助创作者把这种互动关系经营成稳定的粉丝黏性与准社会信任，而不是一次性曝光。",
        },
        {
          title: "我们如何陪跑",
          body: "从选题与人设、排播与中控，到投流复盘与商务对接，团队用可执行的运营方法替代「靠感觉」。技术与平台只是分发层；真正决定结果的，是内容策略、劳动组织与商业安排。",
        },
      ],
    } satisfies AboutContent,
  },
  contact: {
    schema: contactContentSchema,
    default: {
      intro:
        "商务合作、品牌联名或创作者签约，欢迎留下信息。也可前往「加入我们」在线留言，我们会尽快回复。",
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
        "无论你是新人还是已有基础的创作者，只要愿意持续开播、打磨内容与人设，青意传媒提供从孵化培训到平台分发、商务变现的完整陪跑。",
      benefits: [
        {
          title: "保底与透明分成",
          description:
            "提供有竞争力的保底与阶梯分成，收入结构清晰，创作劳动得到对应回报。",
        },
        {
          title: "运营与中控陪跑",
          description:
            "配备中控、场控与投流复盘，协助排播节奏、互动设计与数据优化，降低「算法黑箱」带来的盲目试错。",
        },
        {
          title: "人设与内容培训",
          description:
            "系统训练镜头表现、话术节奏与真实感表达，把个人风格沉淀为可识别的内容品牌。",
        },
      ],
      requirements: [
        "年满 18 周岁，认同长期内容经营而非短期投机",
        "具备表达能力、才艺或垂直内容方向",
        "每周可保证稳定开播时长，配合基础排播计划",
        "愿意接受人设与内容复盘，持续迭代作品",
      ],
      steps: [
        {
          title: "在线报名",
          description: "填写联系方式与方向，说明你的内容定位与开播条件。",
        },
        {
          title: "评估匹配",
          description: "运营评估赛道、表达潜力与平台适配度。",
        },
        {
          title: "签约孵化",
          description: "确认方案后进入人设打磨、内容训练与试播阶段。",
        },
        {
          title: "正式开播",
          description: "团队陪跑分发与变现，稳步提升可见性与粉丝黏性。",
        },
      ],
      contactNote:
        "请在下方留言留下姓名与联系方式；商务合作也可说明合作意向，我们会尽快跟进。",
    } satisfies JoinContent,
  },
} as const;

export type SiteContentKey = keyof typeof siteContentRegistry;
