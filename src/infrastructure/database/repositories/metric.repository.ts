import type { Prisma, StreamerMetric } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";

// Data-access boundary for streamer performance records. History is small
// (one guild), so full scans for aggregation are acceptable and kept simple.
// 主播运营数据记录的数据访问边界。数据量较小（单一公会），聚合时可直接全量扫描，保持简单。
export const metricRepository = {
  create(data: Prisma.StreamerMetricCreateInput): Promise<StreamerMetric> {
    return prisma.streamerMetric.create({ data });
  },

  listByStreamer(streamerId: string): Promise<StreamerMetric[]> {
    return prisma.streamerMetric.findMany({
      where: { streamerId },
      orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  listAll(): Promise<StreamerMetric[]> {
    return prisma.streamerMetric.findMany({
      orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  latestForStreamer(streamerId: string): Promise<StreamerMetric | null> {
    return prisma.streamerMetric.findFirst({
      where: { streamerId },
      orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  findById(id: string): Promise<StreamerMetric | null> {
    return prisma.streamerMetric.findUnique({ where: { id } });
  },

  delete(id: string): Promise<StreamerMetric> {
    return prisma.streamerMetric.delete({ where: { id } });
  },
};
