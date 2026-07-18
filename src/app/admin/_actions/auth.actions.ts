"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginCredentialsSchema } from "@/domain/auth/credentials.schema";
import { authService } from "@/domain/auth/auth.service";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
} from "@/infrastructure/auth/session/session";
import type { ActionResult } from "@/app/admin/_actions/action-result";

// Authenticate an administrator and establish a signed session cookie. A single
// generic error message is returned for any failure to avoid account
// enumeration. The redirect target is validated to be a local admin path.
// 认证管理员并建立已签名会话 cookie。任何失败均返回统一的通用错误信息以防账户枚举；
// 重定向目标经校验须为本地 admin 路径。
export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginCredentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "请输入用户名和密码" };
  }

  const admin = await authService.authenticate(parsed.data);
  if (!admin) {
    return { error: "用户名或密码错误" };
  }

  const token = await createSessionToken({
    userId: admin.id,
    username: admin.username,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  const requested = formData.get("redirect");
  const target =
    typeof requested === "string" && requested.startsWith("/admin")
      ? requested
      : "/admin";
  redirect(target);
}

// Clear the session cookie and return to the login screen.
// 清除会话 cookie 并返回登录页。
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
