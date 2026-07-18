// Shared result shape returned by admin server actions to client forms via
// useActionState. A null error denotes the initial, untouched state.
// 后台服务端 action 通过 useActionState 返回给客户端表单的统一结果结构；error 为 null 表示初始未提交状态。
export interface ActionResult {
  error: string | null;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
}

export const initialActionResult: ActionResult = { error: null };

// Flatten a Zod error into a field-keyed message map for inline form feedback.
// The first path segment identifies the top-level field; non-string segments
// (array indices, symbols) are ignored for this flat mapping.
// 将 Zod 错误扁平化为按字段索引的消息映射，用于表单内联反馈。
// 路径首段标识顶层字段；非字符串段（数组下标、symbol）在此扁平映射中忽略。
export function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
