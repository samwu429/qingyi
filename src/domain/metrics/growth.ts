// Period-over-period growth helpers shared by the admin panel and dashboard.
// A null percentage means there is no comparable previous value (first record)
// or the previous value was zero, where a percentage is not meaningful.
// 后台面板与概览共用的环比增长工具。百分比为 null 表示无可比上期（首条记录）或上期为 0，
// 此时百分比无意义。

export interface GrowthDelta {
  delta: number | null;
  pct: number | null;
}

export function computeGrowth(
  current: number,
  previous: number | undefined | null,
): GrowthDelta {
  if (previous === undefined || previous === null) {
    return { delta: null, pct: null };
  }
  const delta = current - previous;
  if (previous === 0) {
    return { delta, pct: null };
  }
  return { delta, pct: (delta / previous) * 100 };
}
