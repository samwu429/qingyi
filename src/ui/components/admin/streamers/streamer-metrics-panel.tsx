"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { ConfirmSubmit } from "@/ui/components/admin/form/confirm-submit";
import {
  createMetricAction,
  deleteMetricAction,
} from "@/app/admin/_actions/metric.actions";
import {
  initialActionResult,
  type ActionResult,
} from "@/app/admin/_actions/action-result";
import type { MetricHistoryRow } from "@/domain/metrics/metric.service";
import {
  formatFollowers,
  formatGrowthPct,
  formatMoney,
  formatSignedInt,
} from "@/lib/text/format";

// Admin-only performance data manager rendered on the streamer edit page.
// Uploads add a dated record; the newest fan count is mirrored publicly.
// 主播编辑页上的运营数据管理（仅管理员可见）。上传会新增一期记录；最新粉丝数同步前台。
export function StreamerMetricsPanel({
  streamerId,
  metrics,
}: {
  streamerId: string;
  metrics: MetricHistoryRow[];
}) {
  const boundCreate = createMetricAction.bind(null, streamerId);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    boundCreate,
    initialActionResult,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const fieldError = (name: string) => state.fieldErrors?.[name];

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mt-8 border border-mist-100/10 bg-white p-6 sm:p-8">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold text-mist-100">
          运营数据（内部）
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          上传每期粉丝、开播与互动数据。前台仅显示最新粉丝数，其余仅后台可见。
        </p>
      </header>

      <form
        ref={formRef}
        action={formAction}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="统计周期" htmlFor="period" hint={fieldError("period")}>
          <TextInput
            id="period"
            name="period"
            placeholder="例如 2026-07 或 本周"
            required
          />
        </Field>
        <Field label="记录日期" htmlFor="recordedAt" hint={fieldError("recordedAt")}>
          <TextInput id="recordedAt" name="recordedAt" type="date" defaultValue={today} />
        </Field>
        <Field label="粉丝数" htmlFor="metric-followers" hint={fieldError("followers")}>
          <TextInput
            id="metric-followers"
            name="followers"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field label="直播收入（元）" htmlFor="metric-income" hint={fieldError("income")}>
          <TextInput
            id="metric-income"
            name="income"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field
          label="开播时长（分钟）"
          htmlFor="metric-liveMinutes"
          hint={fieldError("liveMinutes")}
        >
          <TextInput
            id="metric-liveMinutes"
            name="liveMinutes"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field label="观众人数" htmlFor="metric-viewers" hint={fieldError("viewers")}>
          <TextInput
            id="metric-viewers"
            name="viewers"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field label="评论人数" htmlFor="metric-comments" hint={fieldError("comments")}>
          <TextInput
            id="metric-comments"
            name="comments"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field label="点赞次数" htmlFor="metric-likes" hint={fieldError("likes")}>
          <TextInput
            id="metric-likes"
            name="likes"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <Field label="收获音浪" htmlFor="metric-yinlang" hint={fieldError("yinlang")}>
          <TextInput
            id="metric-yinlang"
            name="yinlang"
            type="number"
            min={0}
            defaultValue={0}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="备注（选填）" htmlFor="note" hint={fieldError("note")}>
            <TextArea
              id="note"
              name="note"
              className="min-h-16"
              placeholder="如活动、异常波动说明等"
            />
          </Field>
        </div>

        {state.error ? (
          <p className="sm:col-span-2 lg:col-span-4 border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}

        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="bg-jade-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
          >
            {pending ? "上传中…" : "上传数据"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {metrics.length === 0 ? (
          <p className="border border-mist-100/10 bg-ink-950/[0.02] p-6 text-center text-sm text-mist-400">
            还没有数据记录，上传第一期数据后会自动生成数据表。
          </p>
        ) : (
          <div className="overflow-x-auto border border-mist-100/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-850 text-mist-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">周期</th>
                  <th className="px-4 py-2.5 font-medium">日期</th>
                  <th className="px-4 py-2.5 font-medium">粉丝数</th>
                  <th className="px-4 py-2.5 font-medium">粉丝环比</th>
                  <th className="px-4 py-2.5 font-medium">直播收入</th>
                  <th className="px-4 py-2.5 font-medium">开播时长</th>
                  <th className="px-4 py-2.5 font-medium">观众</th>
                  <th className="px-4 py-2.5 font-medium">评论</th>
                  <th className="px-4 py-2.5 font-medium">点赞</th>
                  <th className="px-4 py-2.5 font-medium">音浪</th>
                  <th className="px-4 py-2.5 font-medium">备注</th>
                  <th className="px-4 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.id} className="border-t border-mist-100/10">
                    <td className="px-4 py-2.5 font-medium text-mist-100">
                      {metric.period}
                    </td>
                    <td className="px-4 py-2.5 text-mist-400">
                      {metric.recordedAt}
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.followers.toLocaleString("zh-CN")}
                      <span className="ml-1 text-xs text-mist-400">
                        ({formatFollowers(metric.followers)})
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <GrowthCell
                        delta={metric.followersDelta}
                        pct={metric.followersGrowthPct}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {formatMoney(metric.income)}
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.liveMinutes.toLocaleString("zh-CN")}
                      <span className="ml-1 text-xs text-mist-400">分</span>
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.viewers.toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.comments.toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.likes.toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-2.5 text-mist-200">
                      {metric.yinlang.toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-2.5 text-mist-400">
                      {metric.note ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <form action={deleteMetricAction}>
                          <input type="hidden" name="id" value={metric.id} />
                          <input
                            type="hidden"
                            name="streamerId"
                            value={streamerId}
                          />
                          <ConfirmSubmit
                            confirmMessage={`确认删除「${metric.period}」这条数据记录？`}
                            className="text-red-600 hover:underline disabled:opacity-60"
                          >
                            删除
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function GrowthCell({
  delta,
  pct,
}: {
  delta: number | null;
  pct: number | null;
}) {
  if (delta === null) {
    return <span className="text-mist-400">—</span>;
  }
  const tone =
    delta > 0 ? "text-jade-600" : delta < 0 ? "text-red-600" : "text-mist-400";
  return (
    <span className={tone}>
      {formatSignedInt(delta)}
      <span className="ml-1 text-xs">({formatGrowthPct(pct)})</span>
    </span>
  );
}
