import {
  AdminPageHeader,
  BackLink,
} from "@/ui/components/admin/layout/admin-page-header";
import { StreamerForm } from "@/ui/components/admin/streamers/streamer-form";
import { createStreamerAction } from "@/app/admin/_actions/streamer.actions";

export const dynamic = "force-dynamic";

export default function NewStreamerPage() {
  return (
    <div>
      <BackLink href="/admin/streamers">← 返回主播列表</BackLink>
      <AdminPageHeader title="新增主播" />
      <div className="rounded-2xl border border-mist-300/10 bg-ink-900 p-6 sm:p-8">
        <StreamerForm action={createStreamerAction} />
      </div>
    </div>
  );
}
