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

// Server-side Groq configuration for the on-site chat assistant and the admin
// operations assistant. The key is optional so the site runs (with AI disabled)
// when it is not provided.
// 站内客服与后台运营助手的 Groq 配置。密钥为可选项，未配置时站点照常运行（AI 关闭）。
export const groqConfig = {
  apiKey: process.env.GROQ_API_KEY ?? "",
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  // Multimodal + tool-calling model for admin uploads (screenshots → DB writes).
  // 后台上传（截图入库）用的多模态 + 工具调用模型。
  visionModel:
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct",
  // Admin tool loop defaults to the vision model so text + images share one path.
  // 后台工具循环默认走视觉模型，使纯文本与带图请求共用同一路径。
  adminModel:
    process.env.GROQ_ADMIN_MODEL ||
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct",
} as const;

export function isGroqConfigured(): boolean {
  return Boolean(groqConfig.apiKey);
}
