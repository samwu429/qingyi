import { notFound } from "next/navigation";
import {
  AdminPageHeader,
  BackLink,
} from "@/ui/components/admin/layout/admin-page-header";
import { PostForm } from "@/ui/components/admin/posts/post-form";
import { postService } from "@/domain/blog/post.service";
import { updatePostAction } from "@/app/admin/_actions/post.actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await postService.getById(id);
  if (!post) {
    notFound();
  }

  // Bind the post id so the form receives a (state, formData) action.
  // 绑定文章 id，使表单获得 (state, formData) 形态的 action。
  const boundAction = updatePostAction.bind(null, post.id);

  return (
    <div>
      <BackLink href="/admin/posts">← 返回资讯列表</BackLink>
      <AdminPageHeader title={`编辑资讯 · ${post.title}`} />
      <div className="rounded-2xl border border-mist-300/10 bg-ink-900 p-6 sm:p-8">
        <PostForm action={boundAction} post={post} />
      </div>
    </div>
  );
}
