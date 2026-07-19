"use client";

import { useActionState, useState } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { ImageUrlField } from "@/ui/components/admin/media/image-url-field";
import { RepeatableList } from "@/ui/components/admin/pages/repeatable-list";
import { SaveBar } from "@/ui/components/admin/pages/save-bar";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { HomeContent } from "@/domain/site/site-content.types";
import {
  stripAutoManagedHomeStats,
  type LiveHomeStatValues,
} from "@/domain/site/home-live-stats";

type SaveAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Editor for the home page hero, manual statistics, and highlight cards.
// Creator count + monthly live hours are read-only previews of live DB data.
// 首页主视觉、手工统计与亮点编辑器。签约创作者 / 每月开播时长只读展示实时数据。
export function HomeEditor({
  action,
  value,
  liveStats,
}: {
  action: SaveAction;
  value: HomeContent;
  liveStats: LiveHomeStatValues;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [content, setContent] = useState<HomeContent>(() => ({
    ...value,
    stats: stripAutoManagedHomeStats(value.stats),
  }));

  const set = <K extends keyof HomeContent>(key: K, next: HomeContent[K]) =>
    setContent((prev) => ({ ...prev, [key]: next }));

  const payload: HomeContent = {
    ...content,
    stats: stripAutoManagedHomeStats(content.stats),
  };

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <section className="space-y-5">
        <h2 className="text-lg font-bold text-mist-100">主视觉</h2>
        <Field label="主标题" htmlFor="heroTitle">
          <TextInput
            id="heroTitle"
            value={content.heroTitle}
            onChange={(e) => set("heroTitle", e.target.value)}
          />
        </Field>
        <Field label="副标题" htmlFor="heroSubtitle">
          <TextArea
            id="heroSubtitle"
            value={content.heroSubtitle}
            onChange={(e) => set("heroSubtitle", e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="主按钮文字" htmlFor="heroCtaLabel">
            <TextInput
              id="heroCtaLabel"
              value={content.heroCtaLabel}
              onChange={(e) => set("heroCtaLabel", e.target.value)}
            />
          </Field>
          <Field label="主按钮链接" htmlFor="heroCtaHref">
            <TextInput
              id="heroCtaHref"
              value={content.heroCtaHref}
              onChange={(e) => set("heroCtaHref", e.target.value)}
            />
          </Field>
          <Field label="次按钮文字" htmlFor="heroSecondaryLabel">
            <TextInput
              id="heroSecondaryLabel"
              value={content.heroSecondaryLabel}
              onChange={(e) => set("heroSecondaryLabel", e.target.value)}
            />
          </Field>
          <Field label="次按钮链接" htmlFor="heroSecondaryHref">
            <TextInput
              id="heroSecondaryHref"
              value={content.heroSecondaryHref}
              onChange={(e) => set("heroSecondaryHref", e.target.value)}
            />
          </Field>
        </div>
        <ImageUrlField
          label="主视觉图片"
          value={content.heroImageUrl}
          onUrlChange={(url) => set("heroImageUrl", url)}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">数据统计</h2>

        <div className="border border-mist-100/10 bg-ink-950/[0.02] p-4">
          <p className="text-xs font-medium text-mist-300">自动联动（不可编辑）</p>
          <p className="mt-1 text-xs text-mist-400">
            与前台首页同步：已发布主播数、本月运营数据中的开播总时长。改主播状态或上传开播时长后自动更新。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-mist-100/10 bg-white px-4 py-3">
              <p className="text-xs text-mist-400">签约创作者</p>
              <p className="mt-1 font-display text-2xl font-bold text-jade-500">
                {liveStats.publishedCreators}
              </p>
            </div>
            <div className="border border-mist-100/10 bg-white px-4 py-3">
              <p className="text-xs text-mist-400">每月开播时长</p>
              <p className="mt-1 font-display text-2xl font-bold text-jade-500">
                {liveStats.monthlyLiveHours <= 0
                  ? "0h"
                  : liveStats.monthlyLiveHours < 10
                    ? `${liveStats.monthlyLiveHours.toFixed(1).replace(/\.0$/, "")}h`
                    : `${Math.round(liveStats.monthlyLiveHours)}h`}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-mist-400">
          下方仅编辑其它展示项（如覆盖平台）。请勿再添加「签约创作者 / 开播时长」类标签，保存时会自动剔除。
        </p>
        <RepeatableList
          items={content.stats}
          onChange={(next) => set("stats", stripAutoManagedHomeStats(next))}
          createItem={() => ({ label: "", value: "" })}
          addLabel="添加统计项"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                value={item.value}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="数值，如 10+"
              />
              <TextInput
                value={item.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="标签，如 覆盖内容平台"
              />
            </div>
          )}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">核心亮点</h2>
        <RepeatableList
          items={content.highlights}
          onChange={(next) => set("highlights", next)}
          createItem={() => ({ title: "", description: "" })}
          addLabel="添加亮点"
          renderRow={(item, update) => (
            <div className="space-y-3">
              <TextInput
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="标题"
              />
              <TextArea
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="描述"
                className="min-h-20"
              />
            </div>
          )}
        />
      </section>

      <SaveBar state={state} pending={pending} />
    </form>
  );
}
