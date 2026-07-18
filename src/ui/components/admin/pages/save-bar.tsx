import type { ActionResult } from "@/app/admin/_actions/action-result";

// Shared submit control and status feedback for site-content editors.
// 站点内容编辑器共用的提交控件与状态反馈。
export function SaveBar({
  state,
  pending,
}: {
  state: ActionResult;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-mist-300/10 pt-6">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-jade-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-jade-400 disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存修改"}
      </button>
      {state.error ? (
        <span className="text-sm text-red-300">{state.error}</span>
      ) : state.ok && !pending ? (
        <span className="text-sm text-jade-300">已保存</span>
      ) : null}
    </div>
  );
}
