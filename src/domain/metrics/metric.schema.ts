import { z } from "zod";

// Validation for a single streamer performance record uploaded from the admin
// panel. Numeric fields tolerate empty strings (treated as 0) so the form never
// fails on a blank optional value. Postgres INTEGER caps the maxima.
// 后台上传的单条主播运营数据校验。数值字段容忍空字符串（视为 0），避免可选项留空导致校验失败。
// 上限受 Postgres INTEGER 约束。

const INT_MAX = 2_000_000_000;

function emptyToZero(value: unknown): unknown {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "string" && value.trim() === "") {
    return 0;
  }
  return value;
}

export const metricInputSchema = z.object({
  streamerId: z.string().min(1, "缺少主播标识"),
  period: z
    .string()
    .trim()
    .min(1, "请填写统计周期，例如 2026-07 或 本周")
    .max(40, "统计周期过长"),
  recordedAt: z.preprocess((value) => {
    if (typeof value === "string" && value.trim() !== "") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }, z.date().optional()),
  followers: z.preprocess(
    emptyToZero,
    z.coerce.number().int("粉丝数需为整数").min(0, "粉丝数不能为负").max(INT_MAX, "粉丝数过大"),
  ),
  income: z.preprocess(
    emptyToZero,
    z.coerce
      .number()
      .int("直播收入需为整数元")
      .min(0, "直播收入不能为负")
      .max(INT_MAX, "直播收入过大"),
  ),
  note: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.trim();
    }
    return value ?? "";
  }, z.string().max(200, "备注过长")),
});

export type MetricInput = z.infer<typeof metricInputSchema>;
