// Presentation formatters shared across the UI layer.
// UI 层共用的展示格式化工具。

// Format a follower count into a compact Chinese-friendly label (万 / 亿).
// 将粉丝数格式化为符合中文习惯的紧凑标签（万 / 亿）。
export function formatFollowers(count: number): string {
  if (count >= 100_000_000) {
    return `${(count / 100_000_000).toFixed(1).replace(/\.0$/, "")}亿`;
  }
  if (count >= 10_000) {
    return `${(count / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString("zh-CN");
}

// Format a date as YYYY-MM-DD in the Shanghai timezone for stable, locale-aware
// display regardless of server region.
// 以上海时区将日期格式化为 YYYY-MM-DD，确保不同服务器区域下展示一致。
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\//g, "-");
}
