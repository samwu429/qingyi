"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postInputSchema } from "@/domain/blog/post.schema";
import { postService } from "@/domain/blog/post.service";
import { requireAdmin } from "@/app/admin/_actions/guard";
import {
  summarizeFormErrors,
  toFieldErrors,
  type ActionResult,
} from "@/app/admin/_actions/action-result";
import { parseTagList } from "@/lib/text/tags";

function buildInput(formData: FormData) {
  return postInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverUrl: formData.get("coverUrl"),
    author: formData.get("author"),
    tags: parseTagList(
      typeof formData.get("tags") === "string"
        ? (formData.get("tags") as string)
        : "",
    ),
    status: formData.get("status") ?? "DRAFT",
  });
}

// Revalidate every surface that reflects blog content after a mutation.
// 变更后重新验证所有展示博客内容的页面。
function revalidateBlogSurfaces(slug?: string) {
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createPostAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = buildInput(formData);
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error.issues);
    return {
      error: summarizeFormErrors(fieldErrors),
      fieldErrors,
    };
  }

  const created = await postService.create(parsed.data);
  revalidateBlogSurfaces(created.slug);
  redirect("/admin/posts");
}

export async function updatePostAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = buildInput(formData);
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error.issues);
    return {
      error: summarizeFormErrors(fieldErrors),
      fieldErrors,
    };
  }

  const updated = await postService.update(id, parsed.data);
  revalidateBlogSurfaces(updated.slug);
  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await postService.delete(id);
    revalidateBlogSurfaces();
  }
}
