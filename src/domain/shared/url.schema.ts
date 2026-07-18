import { z } from "zod";

// Optional media / outbound link field. Accepts an empty value, a durable
// site media path (/api/media/...), a legacy local upload path, or an absolute
// http(s) URL. FormData may also yield null when a field is absent.
// 可选的媒体 / 外链字段：允许空值、持久站内媒体路径（/api/media/...）、
// 历史本地上传路径，或绝对 http(s) URL。FormData 字段缺失时可能为 null。
export const optionalUrlSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      // Treat bare protocol stubs as empty so a leftover "https://" placeholder
      // does not fail the whole save.
      // 把仅含协议的占位（如 https://）视为空，避免残留占位导致整表保存失败。
      if (trimmed === "http://" || trimmed === "https://") {
        return "";
      }
      return trimmed;
    }
    return value;
  },
  z.union([
    z.literal(""),
    z
      .string()
      .regex(/^\/api\/media\/[a-zA-Z0-9_-]+$/, "站内媒体路径无效"),
    z
      .string()
      .regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "本地上传路径无效"),
    z.url("请填写有效的链接地址（需以 https:// 开头，或使用上传）"),
  ]),
);
