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
  // Public chat + admin tool loop (text). Prefer a currently-served Groq model;
  // Llama 3.3 / Llama 4 Scout were decommissioned on free/dev tiers in Jul 2026.
  // 前台客服与后台工具循环（文本）。使用 Groq 当前仍提供的模型；
  // Llama 3.3 / Llama 4 Scout 已于 2026-07 在免费/开发者档下线。
  model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  // Multimodal model for screenshot OCR / vision extract.
  // 截图 OCR / 视觉抽取用的多模态模型。
  visionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
  // Optional override for text-only admin tool loop. Default to the lighter
  // gpt-oss-20b for higher free-tier RPM; override with GROQ_ADMIN_MODEL if needed.
  // 纯文本后台工具循环可选覆盖。默认用更轻的 gpt-oss-20b 提高免费档每分钟额度。
  adminModel:
    process.env.GROQ_ADMIN_MODEL ||
    process.env.GROQ_MODEL ||
    "openai/gpt-oss-20b",
} as const;

export function isGroqConfigured(): boolean {
  return Boolean(groqConfig.apiKey);
}
