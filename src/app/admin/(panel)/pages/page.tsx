import Link from "next/link";
import { AdminPageHeader } from "@/ui/components/admin/layout/admin-page-header";
import { HomeEditor } from "@/ui/components/admin/pages/home-editor";
import { AboutEditor } from "@/ui/components/admin/pages/about-editor";
import { ContactEditor } from "@/ui/components/admin/pages/contact-editor";
import { JoinEditor } from "@/ui/components/admin/pages/join-editor";
import { siteContentService } from "@/domain/site/site-content.service";
import { saveSiteContentAction } from "@/app/admin/_actions/site-content.actions";
import type { SiteContentKey } from "@/domain/site/site-content.types";
import { cn } from "@/lib/ui/cn";

export const dynamic = "force-dynamic";

const tabs: { key: SiteContentKey; label: string }[] = [
  { key: "home", label: "首页" },
  { key: "about", label: "关于我们" },
  { key: "join", label: "加入我们" },
  { key: "contact", label: "联系我们" },
];

function isSiteContentKey(value: string | undefined): value is SiteContentKey {
  return tabs.some((tab) => tab.key === value);
}

// Site-content management hub. A tab query parameter selects which page section
// is being edited; each editor persists via a key-bound server action.
// 站点内容管理中心。tab 查询参数选择正在编辑的页面分区；各编辑器通过绑定键的服务端 action 持久化。
export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeKey: SiteContentKey = isSiteContentKey(params.tab)
    ? params.tab
    : "home";

  return (
    <div>
      <AdminPageHeader
        title="页面内容"
        description="编辑前台各页面的文案与展示内容，保存后立即生效。"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/pages?tab=${tab.key}`}
            className={cn(
              "border px-4 py-2 text-sm transition-colors",
              tab.key === activeKey
                ? "border-jade-500 bg-jade-500 text-white"
                : "border-mist-100/15 bg-white text-mist-300 hover:border-jade-500",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="border border-mist-100/10 bg-white p-6 sm:p-8">
        <SectionEditor activeKey={activeKey} />
      </div>
    </div>
  );
}

// Load the content for the active tab and render its dedicated editor.
// 加载当前标签页对应内容并渲染其专属编辑器。
async function SectionEditor({ activeKey }: { activeKey: SiteContentKey }) {
  if (activeKey === "home") {
    const value = await siteContentService.get("home");
    return (
      <HomeEditor
        action={saveSiteContentAction.bind(null, "home")}
        value={value}
      />
    );
  }
  if (activeKey === "about") {
    const value = await siteContentService.get("about");
    return (
      <AboutEditor
        action={saveSiteContentAction.bind(null, "about")}
        value={value}
      />
    );
  }
  if (activeKey === "join") {
    const value = await siteContentService.get("join");
    return (
      <JoinEditor
        action={saveSiteContentAction.bind(null, "join")}
        value={value}
      />
    );
  }
  const value = await siteContentService.get("contact");
  return (
    <ContactEditor
      action={saveSiteContentAction.bind(null, "contact")}
      value={value}
    />
  );
}
