"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, TextArea, TextInput } from "@/ui/components/admin/form/fields";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import { submitJoinInquiryAction } from "@/app/(public)/join/_actions/submit-inquiry.action";

// Public join-us enquiry form. Name and contact are required; a successful
// submit clears the fields and shows a confirmation message.
// 前台加入留言表单。姓名与联系方式必填；提交成功后清空字段并显示确认信息。
export function JoinInquiryForm() {
  const [state, formAction, pending] = useActionState(
    submitJoinInquiryAction,
    initialActionResult,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border border-mist-100/10 bg-white p-6 sm:p-8"
    >
      <h2 className="font-display text-xl font-bold text-mist-100">在线留言</h2>
      <p className="mt-2 text-sm text-mist-400">
        留下姓名与联系方式，我们会尽快与你联系。
      </p>

      <div className="mt-6 space-y-5">
        <Field
          label="姓名 *"
          htmlFor="name"
          hint={state.fieldErrors?.name}
        >
          <TextInput id="name" name="name" required maxLength={60} />
        </Field>

        <Field
          label="联系方式 *"
          htmlFor="contact"
          hint={
            state.fieldErrors?.contact ??
            "手机号 / 微信 / 邮箱均可"
          }
        >
          <TextInput id="contact" name="contact" required maxLength={120} />
        </Field>

        <Field label="留言内容" htmlFor="message" hint={state.fieldErrors?.message}>
          <TextArea
            id="message"
            name="message"
            maxLength={2000}
            className="min-h-32"
            placeholder="可简述你的直播方向、经验或想了解的内容"
          />
        </Field>

        {state.error ? (
          <p className="border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}

        {state.ok && !pending ? (
          <p className="border border-jade-500/30 bg-jade-500/10 px-4 py-2.5 text-sm text-jade-600">
            提交成功，我们已收到你的留言。
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="bg-jade-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
        >
          {pending ? "提交中…" : "提交留言"}
        </button>
      </div>
    </form>
  );
}
