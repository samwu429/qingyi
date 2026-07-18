"use client";

import { useActionState, useState } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { RepeatableList } from "@/ui/components/admin/pages/repeatable-list";
import { SaveBar } from "@/ui/components/admin/pages/save-bar";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { JoinContent } from "@/domain/site/site-content.types";

type SaveAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Editor for the recruitment page: benefits, requirements, and process steps.
// 招募页面编辑器：扶持政策、签约要求与加入流程。
export function JoinEditor({
  action,
  value,
}: {
  action: SaveAction;
  value: JoinContent;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [content, setContent] = useState<JoinContent>(value);

  const set = <K extends keyof JoinContent>(key: K, next: JoinContent[K]) =>
    setContent((prev) => ({ ...prev, [key]: next }));

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(content)} />

      <Field label="引导语" htmlFor="intro">
        <TextArea
          id="intro"
          value={content.intro}
          onChange={(e) => set("intro", e.target.value)}
        />
      </Field>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">主播扶持</h2>
        <RepeatableList
          items={content.benefits}
          onChange={(next) => set("benefits", next)}
          createItem={() => ({ title: "", description: "" })}
          addLabel="添加扶持项"
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

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">签约要求</h2>
        <RepeatableList
          items={content.requirements.map((text) => ({ text }))}
          onChange={(next) =>
            set(
              "requirements",
              next.map((row) => row.text),
            )
          }
          createItem={() => ({ text: "" })}
          addLabel="添加要求"
          renderRow={(item, update) => (
            <TextInput
              value={item.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="要求内容"
            />
          )}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">加入流程</h2>
        <RepeatableList
          items={content.steps}
          onChange={(next) => set("steps", next)}
          createItem={() => ({ title: "", description: "" })}
          addLabel="添加步骤"
          renderRow={(item, update) => (
            <div className="space-y-3">
              <TextInput
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="步骤标题"
              />
              <TextInput
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="步骤说明"
              />
            </div>
          )}
        />
      </section>

      <Field label="报名提示" htmlFor="contactNote">
        <TextArea
          id="contactNote"
          value={content.contactNote}
          onChange={(e) => set("contactNote", e.target.value)}
        />
      </Field>

      <SaveBar state={state} pending={pending} />
    </form>
  );
}
