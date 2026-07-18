"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postInputSchema } from "@/domain/blog/post.schema";
import { postService } from "@/domain/blog/post.service";
import { requireAdmin } from "@/app/admin/_actions/guard";
import {
  toFieldErrors,
  type ActionResult,
} from "@/app/admin/_actions/action-result";

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function buildInput(formData: FormData) {
  return postInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverUrl: formData.get("coverUrl"),
    author: formData.get("author"),
    tags: parseTags(formData.get("tags")),
    status: formData.get("status") ?? "DRAFT",
  });
}

// Revalidate every surface that reflects blog content after a mutation.
// 变更后重新验证所有展示博客内容的页面。
function revalidateBlogSurfaces() {
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
}

export async function createPostAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = buildInput(formData);
  if (!parsed.success) {
    return {
      error: "请检查表单填写",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  await postService.create(parsed.data);
  revalidateBlogSurfaces();
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
    return {
      error: "请检查表单填写",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  await postService.update(id, parsed.data);
  revalidateBlogSurfaces();
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
