import type { HomeContent } from "@/domain/site/site-content.types";

// Overlay homepage stat values that should always mirror live admin data.
// Matching is by label so other custom stats stay manually editable.
// 用后台实时数据覆盖首页统计中需自动更新的项；按标签匹配，其余自定义项仍手工编辑。

export type LiveHomeStatValues = {
  publishedCreators: number;
  /** Total live hours across all streamers in the current calendar month. */
  monthlyLiveHours: number;
};

function formatCreatorCount(count: number): string {
  return String(Math.max(0, count));
}

function formatLiveHours(hours: number): string {
  if (hours <= 0) {
    return "0h";
  }
  if (hours < 10) {
    // Keep one decimal for small totals so short months still look real.
    // 总量较小时保留一位小数，避免短月看起来像整数跳变。
    return `${hours.toFixed(1).replace(/\.0$/, "")}h`;
  }
  return `${Math.round(hours)}h`;
}

function isCreatorStatLabel(label: string): boolean {
  const text = label.trim();
  return /签约创作者|签约主播/.test(text);
}

function isLiveHoursStatLabel(label: string): boolean {
  const text = label.trim();
  return /开播时长/.test(text);
}

export function applyLiveHomeStats(
  stats: HomeContent["stats"],
  live: LiveHomeStatValues,
): HomeContent["stats"] {
  return stats.map((stat) => {
    if (isCreatorStatLabel(stat.label)) {
      return { ...stat, value: formatCreatorCount(live.publishedCreators) };
    }
    if (isLiveHoursStatLabel(stat.label)) {
      return {
        ...stat,
        // Prefer the clearer “每月开播时长” wording when the CMS still has the
        // older “月均开播时长” label.
        // CMS 仍是旧文案「月均开播时长」时，展示改为更贴切的「每月开播时长」。
        label: /月均开播时长/.test(stat.label) ? "每月开播时长" : stat.label,
        value: formatLiveHours(live.monthlyLiveHours),
      };
    }
    return stat;
  });
}

// Current calendar month bounds in local time (Render typically UTC; fine for
// month aggregates). Inclusive end via 23:59:59.999 on the last day.
// 当前自然月起止（本地时区；Render 多为 UTC，做月聚合足够）。结束日含 23:59:59.999。
export function currentMonthRange(now = new Date()): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}
