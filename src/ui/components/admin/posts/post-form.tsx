"use client";

import { useActionState } from "react";
import type { BlogPost } from "@prisma/client";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/ui/components/admin/form/fields";
import { ImageUrlField } from "@/ui/components/admin/media/image-url-field";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";

type PostAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Create/edit form for a blog post. Body is authored in Markdown and rendered as
// sanitised HTML on the public site.
// 博客文章的新增/编辑表单。正文以 Markdown 撰写，在前台以净化后的 HTML 渲染。
export function PostForm({
  action,
  post,
}: {
  action: PostAction;
  post?: BlogPost | null;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-6">
      <Field label="标题" htmlFor="title" hint={fieldError("title")}>
        <TextInput
          id="title"
          name="title"
          defaultValue={post?.title ?? ""}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Slug（留空自动生成，仅英文/数字）"
          htmlFor="slug"
          hint="勿填中文，否则详情页可能打不开"
        >
          <TextInput
            id="slug"
            name="slug"
            defaultValue={post?.slug ?? ""}
            placeholder="例如 growth-guide"
          />
        </Field>
        <Field label="作者" htmlFor="author">
          <TextInput
            id="author"
            name="author"
            defaultValue={post?.author ?? ""}
            placeholder="青意传媒编辑部"
          />
        </Field>
      </div>

      <Field label="摘要" htmlFor="excerpt" hint={fieldError("excerpt")}>
        <TextArea
          id="excerpt"
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
          className="min-h-20"
        />
      </Field>

      <ImageUrlField
        label="封面图片地址"
        name="coverUrl"
        defaultValue={post?.coverUrl ?? ""}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="标签（逗号分隔）" htmlFor="tags">
          <TextInput
            id="tags"
            name="tags"
            defaultValue={post?.tags.join(", ") ?? ""}
            placeholder="公告, 活动, 主播故事"
          />
        </Field>
        <Field label="状态" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={post?.status ?? "DRAFT"}
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">归档</option>
          </Select>
        </Field>
      </div>

      <Field
        label="正文（支持 Markdown）"
        htmlFor="content"
        hint={fieldError("content")}
      >
        <TextArea
          id="content"
          name="content"
          defaultValue={post?.content ?? ""}
          className="min-h-80 font-mono"
          required
        />
      </Field>

      {state.error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-jade-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
