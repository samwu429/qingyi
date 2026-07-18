"use client";

import { useActionState, useState } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { SaveBar } from "@/ui/components/admin/pages/save-bar";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { ContactContent } from "@/domain/site/site-content.types";

type SaveAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Editor for the contact page channels. Empty fields are hidden on the public
// page, so administrators can leave unused channels blank.
// 联系我们页面的渠道编辑器。空字段在前台自动隐藏，未使用的渠道可留空。
export function ContactEditor({
  action,
  value,
}: {
  action: SaveAction;
  value: ContactContent;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [content, setContent] = useState<ContactContent>(value);

  const set = <K extends keyof ContactContent>(
    key: K,
    next: ContactContent[K],
  ) => setContent((prev) => ({ ...prev, [key]: next }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(content)} />

      <Field label="引导语" htmlFor="intro">
        <TextArea
          id="intro"
          value={content.intro}
          onChange={(e) => set("intro", e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="公司地址" htmlFor="address">
          <TextInput
            id="address"
            value={content.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="电子邮箱" htmlFor="email">
          <TextInput
            id="email"
            value={content.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="联系电话" htmlFor="phone">
          <TextInput
            id="phone"
            value={content.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="微信" htmlFor="wechat">
          <TextInput
            id="wechat"
            value={content.wechat}
            onChange={(e) => set("wechat", e.target.value)}
          />
        </Field>
        <Field label="微博链接" htmlFor="weibo">
          <TextInput
            id="weibo"
            value={content.weibo}
            onChange={(e) => set("weibo", e.target.value)}
          />
        </Field>
      </div>

      <SaveBar state={state} pending={pending} />
    </form>
  );
}
