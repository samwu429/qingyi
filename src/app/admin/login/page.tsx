import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { LoginForm } from "@/ui/components/admin/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "后台登录",
  robots: { index: false, follow: false },
};

// Standalone login screen. Access control and post-login routing are handled by
// middleware and the login server action respectively.
// 独立登录页。访问控制与登录后路由分别由中间件与登录服务端 action 处理。
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo =
    params.redirect && params.redirect.startsWith("/admin")
      ? params.redirect
      : "/admin";

  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-jade-500 text-2xl font-black text-ink-950">
            青
          </span>
          <h1 className="mt-4 text-xl font-bold text-mist-100">
            {siteConfig.brandName} 管理后台
          </h1>
          <p className="mt-1 text-sm text-mist-400">请登录以管理站点内容</p>
        </div>

        <div className="rounded-2xl border border-mist-300/10 bg-ink-900 p-7">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
