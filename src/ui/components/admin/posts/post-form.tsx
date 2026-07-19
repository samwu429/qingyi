"use client";

import { useActionState, useState } from "react";
import type { BlogPost } from "@prisma/client";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/ui/components/admin/form/fields";
import { ImageUrlField } from "@/ui/components/admin/media/image-url-field";
import { ContentMediaInserter } from "@/ui/components/admin/media/content-media-inserter";
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
  const [format, setFormat] = useState<"MARKDOWN" | "HTML">(
    post?.format ?? "MARKDOWN",
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
        hint={fieldError("coverUrl")}
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
        label="正文格式"
        htmlFor="format"
        hint={
          format === "HTML"
            ? "HTML 模式：可自由使用 HTML/CSS、内联 SVG、图片长图与 PDF/视频 iframe，按原样排版渲染。"
            : "Markdown 模式：常规图文写作，支持 ![](图片) 与长图。"
        }
      >
        <Select
          id="format"
          name="format"
          value={format}
          onChange={(event) =>
            setFormat(event.target.value as "MARKDOWN" | "HTML")
          }
        >
          <option value="MARKDOWN">Markdown（图文）</option>
          <option value="HTML">HTML / CSS（自由排版）</option>
        </Select>
      </Field>

      <Field
        label={format === "HTML" ? "正文（HTML / CSS）" : "正文（支持 Markdown）"}
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

      <ContentMediaInserter format={format} targetFieldId="content" />

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
