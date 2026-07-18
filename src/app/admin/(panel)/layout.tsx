import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/app/admin/_actions/guard";
import { logoutAction } from "@/app/admin/_actions/auth.actions";
import { AdminNav } from "@/ui/components/admin/layout/admin-nav";
import { siteConfig } from "@/config/site.config";

export const dynamic = "force-dynamic";

// Authenticated back-office shell. Session presence is enforced server-side here
// in addition to the edge middleware for defence in depth.
// 已认证后台外壳。除边缘中间件外，此处在服务端再次强制校验会话，形成纵深防御。
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row">
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-jade-500 text-lg font-black text-ink-950">
              青
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-mist-100">
                {siteConfig.brandName}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-mist-400">
                Admin Console
              </p>
            </div>
          </div>

          <div className="mt-8">
            <AdminNav />
          </div>

          <div className="mt-8 border-t border-mist-300/10 pt-6">
            <p className="px-4 text-xs text-mist-400">
              已登录：{admin.username}
            </p>
            <Link
              href="/"
              target="_blank"
              className="mt-3 block px-4 text-xs text-mist-400 transition-colors hover:text-jade-300"
            >
              查看前台站点 →
            </Link>
            <form action={logoutAction} className="mt-4 px-2">
              <button
                type="submit"
                className="w-full rounded-lg border border-mist-300/15 px-4 py-2 text-sm text-mist-200 transition-colors hover:border-red-500/40 hover:text-red-300"
              >
                退出登录
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
