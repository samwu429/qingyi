import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import type { SessionPayload } from "@/infrastructure/auth/session/session";

// Enforce authentication inside server actions and admin server components.
// Although middleware guards admin routes, server actions can be invoked
// directly, so each mutation re-verifies the session as defence in depth.
// 在服务端 action 与后台服务端组件中强制认证。尽管中间件已保护 admin 路由，
// 服务端 action 仍可被直接调用，故每次变更均重新校验会话，形成纵深防御。
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
