import Link from "next/link";
import { postService } from "@/domain/blog/post.service";
import { deletePostAction } from "@/app/admin/_actions/post.actions";
import { AdminPageHeader } from "@/ui/components/admin/layout/admin-page-header";
import { ConfirmSubmit } from "@/ui/components/admin/form/confirm-submit";
import { formatDate } from "@/lib/text/format";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PUBLISHED: "已发布",
  DRAFT: "草稿",
  ARCHIVED: "已归档",
};

// Blog post management index with quick edit/delete access.
// 博客文章管理列表，提供快捷编辑/删除入口。
export default async function AdminPostsPage() {
  const posts = await postService.listAllForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="资讯管理"
        description="撰写与维护公会动态、行业资讯与主播故事。"
        action={{ label: "发布资讯", href: "/admin/posts/new" }}
      />

      {posts.length === 0 ? (
        <p className="border border-mist-100/10 bg-white p-10 text-center text-mist-400">
          还没有资讯，点击右上角发布第一篇。
        </p>
      ) : (
        <div className="overflow-hidden border border-mist-100/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-850 text-mist-400">
              <tr>
                <th className="px-5 py-3 font-medium">标题</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">发布时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-mist-100/10 bg-white"
                >
                  <td className="px-5 py-3 font-medium text-mist-100">
                    {post.title}
                  </td>
                  <td className="px-5 py-3 text-mist-400">
                    {statusLabels[post.status] ?? post.status}
                  </td>
                  <td className="px-5 py-3 text-mist-400">
                    {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-jade-500 hover:underline"
                      >
                        编辑
                      </Link>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <ConfirmSubmit
                          confirmMessage={`确认删除资讯「${post.title}」？此操作不可撤销。`}
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
