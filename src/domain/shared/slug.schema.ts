import { z } from "zod";

// Optional ASCII slug field. Values are trimmed and lowercased so that an
// operator typing "WS-Phi" does not fail validation and then break saves.
// 可选 ASCII slug 字段：先 trim 并转小写，避免运营输入 "WS-Phi" 时校验失败导致无法保存。
export function optionalAsciiSlugSchema(maxLength: number) {
  return z.preprocess((value) => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value.trim().toLowerCase();
    }
    return value;
  }, z.string().max(maxLength).regex(/^[a-z0-9-]*$/, "Slug 只能含英文、数字和连字符"));
}
