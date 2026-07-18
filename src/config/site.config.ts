// Central static configuration for the public site: brand identity, navigation,
// and default fallback content used before administrators customise it.
// 站点静态配置中心：品牌标识、导航结构，以及管理员自定义之前使用的默认回退内容。

export interface NavigationItem {
  label: string;
  href: string;
}

export const siteConfig = {
  // Legal and brand names sourced from the company business licence.
  // 品牌与法定名称，来源于公司营业执照。
  companyLegalName: "青意贸易（福建福清市）有限公司",
  brandName: "青意传媒",
  brandNameEn: "Qingyi Media",
  tagline: "专业主播孵化 · 内容运营 · 全域直播生态",
  description:
    "青意传媒是专注于主播孵化与直播内容运营的传媒公会，提供签约、培训、流量扶持与商业变现的一站式服务。",
  contact: {
    address: "福建省福清市音西街道",
    email: "contact@qingyimedia.cn",
    phone: "",
    wechat: "",
  },
  // Copyright is jointly held by the company and the site author; the personal
  // site is the preferred channel for technical support and business enquiries.
  // 版权由公司与站点作者共同持有；技术支持与商务咨询优先通过个人网站联系。
  copyright: {
    coOwner: "Yihang (Sam) Wu",
    personalSiteUrl: "https://topphi.com",
    personalSiteLabel: "topphi.com",
  },
  // Primary navigation shared across every public page.
  // 公共页面共享的主导航。
  primaryNavigation: [
    { label: "首页", href: "/" },
    { label: "签约主播", href: "/streamers" },
    { label: "动态资讯", href: "/blog" },
    { label: "关于我们", href: "/about" },
    { label: "加入我们", href: "/join" },
    { label: "联系我们", href: "/contact" },
  ] satisfies NavigationItem[],
} as const;

export type SiteConfig = typeof siteConfig;
