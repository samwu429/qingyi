import type { AdminUser } from "@prisma/client";
import { adminUserRepository } from "@/infrastructure/database/repositories/admin-user.repository";
import { hashPassword, verifyPassword } from "@/infrastructure/auth/password";
import type { LoginCredentials } from "@/domain/auth/credentials.schema";

// Authentication use cases. Credential verification returns a normalised result
// without leaking whether the username or the password was the failing factor.
// 认证用例。凭证校验返回归一化结果，不泄露失败原因是用户名还是密码，以降低账户枚举风险。

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  displayName: string | null;
}

function toAuthenticated(user: AdminUser): AuthenticatedAdmin {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

export const authService = {
  async authenticate(
    credentials: LoginCredentials,
  ): Promise<AuthenticatedAdmin | null> {
    const user = await adminUserRepository.findByUsername(credentials.username);
    if (!user) {
      // Perform a dummy comparison to keep response timing uniform.
      // 执行一次占位比对以保持响应时间一致，缓解时序侧信道。
      await verifyPassword(credentials.password, DUMMY_HASH);
      return null;
    }
    const valid = await verifyPassword(credentials.password, user.passwordHash);
    return valid ? toAuthenticated(user) : null;
  },

  async getById(id: string): Promise<AuthenticatedAdmin | null> {
    const user = await adminUserRepository.findById(id);
    return user ? toAuthenticated(user) : null;
  },

  // Create the initial administrator when none exists. Used by the seed script.
  // 当不存在管理员时创建初始管理员，供 seed 脚本使用。
  async ensureInitialAdmin(
    username: string,
    plainPassword: string,
  ): Promise<{ created: boolean }> {
    const existing = await adminUserRepository.findByUsername(username);
    if (existing) {
      return { created: false };
    }
    const passwordHash = await hashPassword(plainPassword);
    await adminUserRepository.create({ username, passwordHash });
    return { created: true };
  },
};

// A constant bcrypt hash of a random value, used only for timing equalisation.
// 一个随机值的固定 bcrypt 哈希，仅用于时序均衡。
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEeO6Yb1Xh9v0hV3nQ0h1M2eKcQ8dU2Yb1a";
