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
    <div className="flex items-center gap-4 border-t border-mist-100/10 pt-6">
      <button
        type="submit"
        disabled={pending}
        className="bg-jade-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存修改"}
      </button>
      {state.error ? (
        <span className="text-sm text-red-600">{state.error}</span>
      ) : state.ok && !pending ? (
        <span className="text-sm text-jade-500">已保存</span>
      ) : null}
    </div>
  );
}
