import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@/infrastructure/auth/session/session";

// Resolve the authenticated administrator from the request cookies for use in
// server components and server actions. Returns null when unauthenticated.
// 在服务端组件与服务端 action 中，从请求 cookie 解析已认证管理员；未认证时返回 null。
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
