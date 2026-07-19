import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/app/admin/_actions/guard";
import { logoutAction } from "@/app/admin/_actions/auth.actions";
import { BrandLogo } from "@/ui/components/brand/brand-logo";
import { AdminNav } from "@/ui/components/admin/layout/admin-nav";

export const dynamic = "force-dynamic";

// Authenticated back-office shell. Session presence is enforced server-side here
// in addition to the edge proxy for defence in depth.
// 已认证后台外壳。除边缘代理外，此处在服务端再次强制校验会话，形成纵深防御。
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row">
        <aside className="border border-mist-100/10 bg-white p-5 lg:w-64 lg:flex-shrink-0">
          <BrandLogo variant="mark" linked={false} className="h-10 w-10" />

          <div className="mt-8">
            <AdminNav />
          </div>

          <div className="mt-8 border-t border-mist-100/10 pt-6">
            <p className="px-2 text-xs text-mist-400">
              已登录：{admin.username}
            </p>
            <Link
              href="/"
              target="_blank"
              className="mt-3 block px-2 text-xs text-mist-400 transition-colors hover:text-jade-500"
            >
              查看前台站点 →
            </Link>
            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="w-full border border-mist-100/15 px-4 py-2 text-sm text-mist-200 transition-colors hover:border-red-500/40 hover:text-red-600"
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
