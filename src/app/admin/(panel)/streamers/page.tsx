import Link from "next/link";
import { streamerService } from "@/domain/streamers/streamer.service";
import { deleteStreamerAction } from "@/app/admin/_actions/streamer.actions";
import { AdminPageHeader } from "@/ui/components/admin/layout/admin-page-header";
import { ConfirmSubmit } from "@/ui/components/admin/form/confirm-submit";
import { Badge } from "@/ui/components/primitives/badge";
import { formatFollowers } from "@/lib/text/format";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PUBLISHED: "已发布",
  DRAFT: "草稿",
  ARCHIVED: "已归档",
};

// Streamer management index listing every profile with quick edit/delete access.
// 主播管理列表，列出全部档案并提供快捷编辑/删除入口。
export default async function AdminStreamersPage() {
  const streamers = await streamerService.listAllForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="主播管理"
        description="维护公会签约主播档案，控制展示顺序与推荐位。"
        action={{ label: "新增主播", href: "/admin/streamers/new" }}
      />

      {streamers.length === 0 ? (
        <p className="border border-mist-100/10 bg-white p-10 text-center text-mist-400">
          还没有主播，点击右上角新增第一位主播。
        </p>
      ) : (
        <div className="overflow-hidden border border-mist-100/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-850 text-mist-400">
              <tr>
                <th className="px-5 py-3 font-medium">名称</th>
                <th className="px-5 py-3 font-medium">分类</th>
                <th className="px-5 py-3 font-medium">粉丝</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {streamers.map((streamer) => (
                <tr
                  key={streamer.id}
                  className="border-t border-mist-100/10 bg-white"
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-mist-100">
                      {streamer.name}
                    </span>
                    {streamer.featured ? (
                      <span className="ml-2">
                        <Badge tone="jade">推荐</Badge>
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-mist-400">
                    {streamer.category ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-mist-400">
                    {formatFollowers(streamer.followers)}
                  </td>
                  <td className="px-5 py-3 text-mist-400">
                    {statusLabels[streamer.status] ?? streamer.status}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/streamers/${streamer.id}/edit`}
                        className="text-jade-500 hover:underline"
                      >
                        编辑
                      </Link>
                      <form action={deleteStreamerAction}>
                        <input type="hidden" name="id" value={streamer.id} />
                        <ConfirmSubmit
                          confirmMessage={`确认删除主播「${streamer.name}」？此操作不可撤销。`}
                          className="text-red-600 hover:underline disabled:opacity-60"
                        >
                          删除
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
