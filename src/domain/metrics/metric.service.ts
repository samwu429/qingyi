import type { StreamerMetric } from "@prisma/client";
import { metricRepository } from "@/infrastructure/database/repositories/metric.repository";
import { streamerRepository } from "@/infrastructure/database/repositories/streamer.repository";
import type { MetricInput } from "@/domain/metrics/metric.schema";

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
}

export interface MetricDashboard {
  rows: StreamerMetricRow[];
  followersRank: StreamerMetricRow[];
  incomeRank: StreamerMetricRow[];
  totals: {
    streamers: number;
    followers: number;
    income: number;
    records: number;
  };
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

    return { rows, followersRank, incomeRank, totals };
  },
};
