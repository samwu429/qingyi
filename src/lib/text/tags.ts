// Split a human-entered tag string into a clean, de-duplicated list. Accepts
// both Western and Chinese commas plus newlines, which operators commonly mix.
// 将人工输入的标签字符串拆成去重后的干净列表；同时接受中英文逗号与换行，
// 因为运营填写时经常混用。
export function parseTagList(raw: string | null | undefined): string[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .split(/[,，、\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}
