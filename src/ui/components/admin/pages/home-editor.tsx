"use client";

import { useActionState, useState } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { ImageUrlField } from "@/ui/components/admin/media/image-url-field";
import { RepeatableList } from "@/ui/components/admin/pages/repeatable-list";
import { SaveBar } from "@/ui/components/admin/pages/save-bar";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { HomeContent } from "@/domain/site/site-content.types";

type SaveAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Editor for the home page hero, statistics, and highlight cards. The full
// content object is held in local state and submitted as a single JSON payload.
// 首页主视觉、统计与亮点卡片的编辑器。完整内容对象存于本地状态，以单个 JSON 载荷提交。
export function HomeEditor({
  action,
  value,
}: {
  action: SaveAction;
  value: HomeContent;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [content, setContent] = useState<HomeContent>(value);

  const set = <K extends keyof HomeContent>(key: K, next: HomeContent[K]) =>
    setContent((prev) => ({ ...prev, [key]: next }));

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(content)} />

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
        <p className="text-xs text-mist-400">
          标签为「签约创作者」「每月开播时长」（或含「开播时长」）时，前台数值会按后台实时计算：已发布主播数、本月上传运营数据的开播总时长。其它统计项仍用下方填写的数值。
        </p>
        <RepeatableList
          items={content.stats}
          onChange={(next) => set("stats", next)}
          createItem={() => ({ label: "", value: "" })}
          addLabel="添加统计项"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                value={item.value}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="数值，如 120+"
              />
              <TextInput
                value={item.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="标签，如 签约创作者"
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
