import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "@/config/env";

// Signed, httpOnly session tokens for the admin panel. Sessions are stateless
// JWTs verified with a server-only secret; the token is transported in an
// httpOnly cookie to mitigate XSS-based theft.
// 后台面板的已签名 httpOnly 会话令牌。会话为无状态 JWT，使用仅服务端可见的密钥验证；
// 令牌通过 httpOnly cookie 传输，以降低基于 XSS 的窃取风险。

export const SESSION_COOKIE_NAME = "qingyi_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface SessionPayload {
  userId: string;
  username: string;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

// Verify a session token and return its payload, or null when invalid/expired.
// 验证会话令牌并返回负载；无效或过期时返回 null。
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.username !== "string") {
      return null;
    }
    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
