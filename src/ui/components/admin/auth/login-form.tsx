"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/_actions/auth.actions";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import { Field, TextInput } from "@/ui/components/admin/form/fields";

// Administrator login form wired to the login server action via useActionState.
// 通过 useActionState 接入登录服务端 action 的管理员登录表单。
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialActionResult,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirect" value={redirectTo} />

      <Field label="用户名" htmlFor="username">
        <TextInput
          id="username"
          name="username"
          autoComplete="username"
          required
        />
      </Field>

      <Field label="密码" htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-jade-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-jade-400 disabled:opacity-60"
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
