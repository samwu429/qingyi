import {
  AdminPageHeader,
  BackLink,
} from "@/ui/components/admin/layout/admin-page-header";
import { PostForm } from "@/ui/components/admin/posts/post-form";
import { createPostAction } from "@/app/admin/_actions/post.actions";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <div>
      <BackLink href="/admin/posts">← 返回资讯列表</BackLink>
      <AdminPageHeader title="发布资讯" />
      <div className="border border-mist-100/10 bg-white p-6 sm:p-8">
        <PostForm action={createPostAction} />
      </div>
    </div>
  );
}
