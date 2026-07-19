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

const nonNegInt = (label: string) =>
  z.preprocess(
    emptyToZero,
    z.coerce
      .number()
      .int(`${label}需为整数`)
      .min(0, `${label}不能为负`)
      .max(INT_MAX, `${label}过大`),
  );

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
  followers: nonNegInt("粉丝数"),
  income: nonNegInt("直播收入"),
  liveMinutes: nonNegInt("开播时长"),
  viewers: nonNegInt("观众人数"),
  comments: nonNegInt("评论人数"),
  likes: nonNegInt("点赞次数"),
  yinlang: nonNegInt("音浪"),
  note: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.trim();
    }
    return value ?? "";
  }, z.string().max(200, "备注过长")),
});

export type MetricInput = z.infer<typeof metricInputSchema>;
