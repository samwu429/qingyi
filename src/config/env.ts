import { z } from "zod";

// Server-side environment contract. Values are validated lazily on first access
// so that build-time steps that do not touch runtime secrets never fail.
// 服务端环境变量契约。首次访问时才进行惰性校验，避免不涉及运行时密钥的构建步骤失败。
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

// Resolve and cache validated server environment variables.
// Throws a descriptive error when required references are absent at runtime.
// 解析并缓存已校验的服务端环境变量；运行时缺失必需引用时抛出可读错误。
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${issues}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

// Public media configuration exposed to the browser for optional image uploads.
// Absent values simply disable the upload widget and fall back to manual URLs.
// 暴露给浏览器的公开媒体配置，用于可选图片上传；缺失时禁用上传组件并回退到手动填写地址。
export const publicMediaConfig = {
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryUploadPreset:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "",
} as const;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    publicMediaConfig.cloudinaryCloudName &&
      publicMediaConfig.cloudinaryUploadPreset,
  );
}
