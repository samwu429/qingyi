import { notFound } from "next/navigation";
import {
  AdminPageHeader,
  BackLink,
} from "@/ui/components/admin/layout/admin-page-header";
import { StreamerForm } from "@/ui/components/admin/streamers/streamer-form";
import {
  StreamerMetricsPanel,
  type MetricRow,
} from "@/ui/components/admin/streamers/streamer-metrics-panel";
import { streamerService } from "@/domain/streamers/streamer.service";
import { metricService } from "@/domain/metrics/metric.service";
import { updateStreamerAction } from "@/app/admin/_actions/streamer.actions";
import { formatDate } from "@/lib/text/format";

export const dynamic = "force-dynamic";

export default async function EditStreamerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const streamer = await streamerService.getById(id);
  if (!streamer) {
    notFound();
  }

  const metrics = await metricService.listByStreamer(streamer.id);
  const metricRows: MetricRow[] = metrics.map((metric) => ({
    id: metric.id,
    period: metric.period,
    followers: metric.followers,
    income: metric.income,
    note: metric.note,
    recordedAt: formatDate(metric.recordedAt),
  }));

  // Bind the streamer id so the form receives a (state, formData) action.
  // 绑定主播 id，使表单获得 (state, formData) 形态的 action。
  const boundAction = updateStreamerAction.bind(null, streamer.id);

  return (
    <div>
      <BackLink href="/admin/streamers">← 返回主播列表</BackLink>
      <AdminPageHeader title={`编辑主播 · ${streamer.name}`} />
      <div className="border border-mist-100/10 bg-white p-6 sm:p-8">
        <StreamerForm action={boundAction} streamer={streamer} />
      </div>
      <StreamerMetricsPanel streamerId={streamer.id} metrics={metricRows} />
    </div>
  );
}
