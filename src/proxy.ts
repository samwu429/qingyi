import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/infrastructure/auth/session/session";

// Edge proxy guarding the back office. Unauthenticated requests to any /admin
// route (except the login page) are redirected to the login form, and an
// already-authenticated visitor to the login page is sent to the dashboard.
// 保护后台的 Edge 代理：未认证访问任意 /admin 路由（登录页除外）将被重定向到登录表单；
// 已认证用户访问登录页则被送往控制台。
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
