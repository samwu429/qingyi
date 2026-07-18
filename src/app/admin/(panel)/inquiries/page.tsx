import { inquiryService } from "@/domain/inquiries/inquiry.service";
import {
  deleteInquiryAction,
  markInquiryReadAction,
} from "@/app/admin/_actions/inquiry.actions";
import { AdminPageHeader } from "@/ui/components/admin/layout/admin-page-header";
import { ConfirmSubmit } from "@/ui/components/admin/form/confirm-submit";
import { Badge } from "@/ui/components/primitives/badge";
import { formatDate } from "@/lib/text/format";

export const dynamic = "force-dynamic";

// Admin inbox for join-us enquiries. Unread rows surface first so follow-up is
// prioritised; operators can mark items read or delete them.
// 「加入我们」留言收件箱。未读优先排列便于跟进；可标记已读或删除。
export default async function AdminInquiriesPage() {
  const inquiries = await inquiryService.listForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="留言管理"
        description="查看来自「加入我们」页面的报名留言。"
      />

      {inquiries.length === 0 ? (
        <p className="border border-mist-100/10 bg-white p-10 text-center text-mist-400">
          暂无留言。
        </p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="border border-mist-100/10 bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-mist-100">
                      {inquiry.name}
                    </h2>
                    {inquiry.isRead ? (
                      <Badge>已读</Badge>
                    ) : (
                      <Badge tone="jade">未读</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-mist-300">
                    联系方式：{inquiry.contact}
                  </p>
                  <p className="mt-1 text-xs text-mist-400">
                    {formatDate(inquiry.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!inquiry.isRead ? (
                    <form action={markInquiryReadAction}>
                      <input type="hidden" name="id" value={inquiry.id} />
                      <button
                        type="submit"
                        className="text-sm text-jade-500 hover:underline"
                      >
                        标为已读
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteInquiryAction}>
                    <input type="hidden" name="id" value={inquiry.id} />
                    <ConfirmSubmit
                      confirmMessage={`确认删除「${inquiry.name}」的留言？此操作不可撤销。`}
                      className="text-sm text-red-600 hover:underline disabled:opacity-60"
                    >
                      删除
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
              {inquiry.message ? (
                <p className="mt-4 whitespace-pre-wrap border-t border-mist-100/10 pt-4 text-sm leading-relaxed text-mist-200">
                  {inquiry.message}
                </p>
              ) : (
                <p className="mt-4 border-t border-mist-100/10 pt-4 text-sm text-mist-400">
                  （未填写留言内容）
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
