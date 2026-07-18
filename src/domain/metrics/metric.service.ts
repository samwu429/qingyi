import type { StreamerMetric } from "@prisma/client";
import { metricRepository } from "@/infrastructure/database/repositories/metric.repository";
import { streamerRepository } from "@/infrastructure/database/repositories/streamer.repository";
import type { MetricInput } from "@/domain/metrics/metric.schema";
import { computeGrowth } from "@/domain/metrics/growth";
import { formatDate } from "@/lib/text/format";

// Application services for streamer performance data. Creating or deleting a
// record re-syncs the public fan count so the site always mirrors the latest
// uploaded figure, while income/history stay internal to the admin console.
// 主播运营数据的应用服务。新增或删除记录后会同步前台粉丝数，使站点始终展示最新上传值；
// 收入与历史数据仅在后台内部可见。

export interface StreamerMetricRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  followers: number;
  totalIncome: number;
  latestIncome: number;
  latestPeriod: string | null;
  recordCount: number;
  followersDelta: number | null;
  followersGrowthPct: number | null;
  incomeDelta: number | null;
  incomeGrowthPct: number | null;
}

export interface MetricDashboard {
  rows: StreamerMetricRow[];
  followersRank: StreamerMetricRow[];
  incomeRank: StreamerMetricRow[];
  growthRank: StreamerMetricRow[];
  totals: {
    streamers: number;
    followers: number;
    income: number;
    records: number;
  };
}

// A streamer performance record enriched with growth versus the previous period.
// 附带环比增长信息的主播运营数据记录。
export interface MetricHistoryRow {
  id: string;
  period: string;
  followers: number;
  income: number;
  note: string | null;
  recordedAt: string;
  followersDelta: number | null;
  followersGrowthPct: number | null;
  incomeDelta: number | null;
  incomeGrowthPct: number | null;
}

// A flattened row prepared for CSV export.
// 为 CSV 导出准备的扁平行。
export interface MetricExportRow {
  name: string;
  category: string;
  period: string;
  recordedAt: string;
  followers: number;
  income: number;
  note: string;
}

// Recompute the public fan count from the streamer's newest record.
// 依据主播最新记录重算前台粉丝数。
async function syncLatestFollowers(streamerId: string): Promise<void> {
  const latest = await metricRepository.latestForStreamer(streamerId);
  if (latest) {
    await streamerRepository.update(streamerId, { followers: latest.followers });
  }
}

export const metricService = {
  listByStreamer(streamerId: string): Promise<StreamerMetric[]> {
    return metricRepository.listByStreamer(streamerId);
  },

  // History (newest first) with each record compared to the older one below it.
  // 历史记录（最新在前），每条与其下方的上一期对比得出环比。
  async getStreamerHistory(streamerId: string): Promise<MetricHistoryRow[]> {
    const metrics = await metricRepository.listByStreamer(streamerId);
    return metrics.map((metric, index) => {
      const previous = metrics[index + 1];
      const followersGrowth = computeGrowth(metric.followers, previous?.followers);
      const incomeGrowth = computeGrowth(metric.income, previous?.income);
      return {
        id: metric.id,
        period: metric.period,
        followers: metric.followers,
        income: metric.income,
        note: metric.note,
        recordedAt: formatDate(metric.recordedAt),
        followersDelta: followersGrowth.delta,
        followersGrowthPct: followersGrowth.pct,
        incomeDelta: incomeGrowth.delta,
        incomeGrowthPct: incomeGrowth.pct,
      };
    });
  },

  async getExportRows(filter: {
    from?: Date;
    to?: Date;
    streamerId?: string;
  }): Promise<MetricExportRow[]> {
    const metrics = await metricRepository.listForExport(filter);
    return metrics.map((metric) => ({
      name: metric.streamer?.name ?? "",
      category: metric.streamer?.category ?? "",
      period: metric.period,
      recordedAt: formatDate(metric.recordedAt),
      followers: metric.followers,
      income: metric.income,
      note: metric.note ?? "",
    }));
  },

  async create(input: MetricInput): Promise<StreamerMetric> {
    const metric = await metricRepository.create({
      streamer: { connect: { id: input.streamerId } },
      period: input.period.trim(),
      followers: input.followers,
      income: input.income,
      note: input.note.trim() ? input.note.trim() : null,
      ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
    });
    await syncLatestFollowers(input.streamerId);
    return metric;
  },

  async delete(id: string): Promise<StreamerMetric | null> {
    const existing = await metricRepository.findById(id);
    if (!existing) {
      return null;
    }
    const metric = await metricRepository.delete(id);
    await syncLatestFollowers(existing.streamerId);
    return metric;
  },

  async getDashboard(): Promise<MetricDashboard> {
    const [streamers, metrics] = await Promise.all([
      streamerRepository.list(),
      metricRepository.listAll(),
    ]);

    const byStreamer = new Map<string, StreamerMetric[]>();
    for (const metric of metrics) {
      const list = byStreamer.get(metric.streamerId) ?? [];
      list.push(metric);
      byStreamer.set(metric.streamerId, list);
    }

    const rows: StreamerMetricRow[] = streamers.map((streamer) => {
      const list = (byStreamer.get(streamer.id) ?? [])
        .slice()
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
      const totalIncome = list.reduce((sum, item) => sum + item.income, 0);
      const latest = list[0];
      const previous = list[1];
      const followersGrowth = computeGrowth(
        latest?.followers ?? streamer.followers,
        previous?.followers,
      );
      const incomeGrowth = computeGrowth(latest?.income ?? 0, previous?.income);
      return {
        id: streamer.id,
        name: streamer.name,
        slug: streamer.slug,
        category: streamer.category,
        followers: streamer.followers,
        totalIncome,
        latestIncome: latest?.income ?? 0,
        latestPeriod: latest?.period ?? null,
        recordCount: list.length,
        followersDelta: followersGrowth.delta,
        followersGrowthPct: followersGrowth.pct,
        incomeDelta: incomeGrowth.delta,
        incomeGrowthPct: incomeGrowth.pct,
      };
    });

    const totals = {
      streamers: streamers.length,
      followers: rows.reduce((sum, row) => sum + row.followers, 0),
      income: rows.reduce((sum, row) => sum + row.totalIncome, 0),
      records: metrics.length,
    };

    const followersRank = [...rows].sort((a, b) => b.followers - a.followers);
    const incomeRank = [...rows].sort((a, b) => b.totalIncome - a.totalIncome);
    const growthRank = [...rows]
      .filter((row) => row.followersDelta !== null)
      .sort((a, b) => (b.followersDelta ?? 0) - (a.followersDelta ?? 0));

    return { rows, followersRank, incomeRank, growthRank, totals };
  },
};
