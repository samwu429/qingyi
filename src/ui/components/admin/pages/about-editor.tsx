"use client";

import { useActionState, useState } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { RepeatableList } from "@/ui/components/admin/pages/repeatable-list";
import { SaveBar } from "@/ui/components/admin/pages/save-bar";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { AboutContent } from "@/domain/site/site-content.types";

type SaveAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Editor for the about page introduction and content sections.
// 关于我们页面的介绍与内容分区编辑器。
export function AboutEditor({
  action,
  value,
}: {
  action: SaveAction;
  value: AboutContent;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [content, setContent] = useState<AboutContent>(value);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(content)} />

      <Field label="公司简介" htmlFor="intro">
        <TextArea
          id="intro"
          value={content.intro}
          onChange={(e) =>
            setContent((prev) => ({ ...prev, intro: e.target.value }))
          }
          className="min-h-32"
        />
      </Field>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-mist-100">内容分区</h2>
        <RepeatableList
          items={content.sections}
          onChange={(next) =>
            setContent((prev) => ({ ...prev, sections: next }))
          }
          createItem={() => ({ title: "", body: "" })}
          addLabel="添加分区"
          renderRow={(item, update) => (
            <div className="space-y-3">
              <TextInput
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="分区标题"
              />
              <TextArea
                value={item.body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder="分区内容"
                className="min-h-24"
              />
            </div>
          )}
        />
      </section>

      <SaveBar state={state} pending={pending} />
    </form>
  );
}
