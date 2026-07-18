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

// Format an income figure (in whole RMB yuan) into a compact ¥ label (万 / 亿).
// Used for internal, admin-only statistics.
// 将收入金额（整数人民币元）格式化为紧凑的 ¥ 标签（万 / 亿），用于后台内部统计。
export function formatMoney(yuan: number): string {
  if (yuan >= 100_000_000) {
    return `¥${(yuan / 100_000_000).toFixed(2).replace(/\.?0+$/, "")}亿`;
  }
  if (yuan >= 10_000) {
    return `¥${(yuan / 10_000).toFixed(2).replace(/\.?0+$/, "")}万`;
  }
  return `¥${yuan.toLocaleString("zh-CN")}`;
}

// Format a signed integer delta with a leading + for positive values.
// 为增量数值添加符号，正值前缀 +。
export function formatSignedInt(value: number): string {
  const label = Math.abs(value).toLocaleString("zh-CN");
  if (value > 0) return `+${label}`;
  if (value < 0) return `-${label}`;
  return "0";
}

// Format a period-over-period growth percentage. null means no comparable
// previous record (or a zero base), rendered as an em dash.
// 格式化环比增长百分比。null 表示无可比上期（或基数为 0），显示为破折号。
export function formatGrowthPct(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(1));
  const label = `${rounded}%`;
  if (rounded > 0) return `+${label}`;
  return label;
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
