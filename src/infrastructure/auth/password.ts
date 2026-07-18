import bcrypt from "bcryptjs";

// Password hashing utilities. A work factor of 12 balances resistance against
// offline attacks with acceptable latency for interactive admin logins.
// 密码哈希工具。工作因子取 12，在抵御离线破解与后台登录可接受延迟之间取得平衡。
const SALT_ROUNDS = 12;

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export function verifyPassword(
  plainText: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, passwordHash);
}
