import { z } from "zod";

// Validation contract for the admin login form.
// 后台登录表单的校验契约。
export const loginCredentialsSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").max(60),
  password: z.string().min(1, "请输入密码").max(200),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
