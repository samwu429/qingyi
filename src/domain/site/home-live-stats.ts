import type { HomeContent } from "@/domain/site/site-content.types";

// Homepage stats that are driven only by live admin data (published streamers +
// current-month liveMinutes). They are never stored/edited in page CMS.
// 首页「签约创作者」「每月开播时长」只跟后台实时数据走，不进页面 CMS、不可手改。

export type LiveHomeStatValues = {
  publishedCreators: number;
  monthlyLiveHours: number;
};

export type HomeStatItem = HomeContent["stats"][number];

export function isAutoManagedHomeStatLabel(label: string): boolean {
  const text = label.trim();
  return /签约创作者|签约主播/.test(text) || /开播时长/.test(text);
}

export function stripAutoManagedHomeStats(
  stats: HomeStatItem[],
): HomeStatItem[] {
  return stats.filter((item) => !isAutoManagedHomeStatLabel(item.label));
}

function formatCreatorCount(count: number): string {
  return String(Math.max(0, count));
}

function formatLiveHours(hours: number): string {
  if (hours <= 0) {
    return "0h";
  }
  if (hours < 10) {
    return `${hours.toFixed(1).replace(/\.0$/, "")}h`;
  }
  return `${Math.round(hours)}h`;
}

export function buildLiveHomeStatItems(
  live: LiveHomeStatValues,
): HomeStatItem[] {
  return [
    {
      label: "签约创作者",
      value: formatCreatorCount(live.publishedCreators),
    },
    {
      label: "每月开播时长",
      value: formatLiveHours(live.monthlyLiveHours),
    },
  ];
}

// Public homepage: live pair first, then any manually authored extras.
// 前台首页：先放两项实时数据，再接 CMS 里其余手工统计。
export function buildPublicHomeStats(
  storedStats: HomeStatItem[],
  live: LiveHomeStatValues,
): HomeStatItem[] {
  return [
    ...buildLiveHomeStatItems(live),
    ...stripAutoManagedHomeStats(storedStats),
  ];
}

export function currentMonthRange(now = new Date()): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { from, to };
}
