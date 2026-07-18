import { notFound } from "next/navigation";
import {
  AdminPageHeader,
  BackLink,
} from "@/ui/components/admin/layout/admin-page-header";
import { StreamerForm } from "@/ui/components/admin/streamers/streamer-form";
import { streamerService } from "@/domain/streamers/streamer.service";
import { updateStreamerAction } from "@/app/admin/_actions/streamer.actions";

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

  // Bind the streamer id so the form receives a (state, formData) action.
  // 绑定主播 id，使表单获得 (state, formData) 形态的 action。
  const boundAction = updateStreamerAction.bind(null, streamer.id);

  return (
    <div>
      <BackLink href="/admin/streamers">← 返回主播列表</BackLink>
      <AdminPageHeader title={`编辑主播 · ${streamer.name}`} />
      <div className="rounded-2xl border border-mist-300/10 bg-ink-900 p-6 sm:p-8">
        <StreamerForm action={boundAction} streamer={streamer} />
      </div>
    </div>
  );
}
