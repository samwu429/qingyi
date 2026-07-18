"use client";

import { useActionState, useState } from "react";
import type { Streamer } from "@prisma/client";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/ui/components/admin/form/fields";
import { ImageUrlField } from "@/ui/components/admin/media/image-url-field";
import { initialActionResult } from "@/app/admin/_actions/action-result";
import type { ActionResult } from "@/app/admin/_actions/action-result";
import type { SocialLink } from "@/domain/streamers/streamer.schema";

type StreamerAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

// Parse the persisted socials JSON column into typed rows for editing.
// 将已持久化的 socials JSON 列解析为可编辑的类型化行。
function readSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is SocialLink =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as SocialLink).label === "string" &&
      typeof (item as SocialLink).url === "string",
  );
}

// Create/edit form for a streamer profile. Socials are managed as local state and
// serialised into a hidden field consumed by the server action.
// 主播档案的新增/编辑表单。社交链接以本地状态管理，并序列化到隐藏字段供服务端 action 读取。
export function StreamerForm({
  action,
  streamer,
}: {
  action: StreamerAction;
  streamer?: Streamer | null;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionResult,
  );
  const [socials, setSocials] = useState<SocialLink[]>(
    readSocials(streamer?.socials),
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  const updateSocial = (index: number, patch: Partial<SocialLink>) => {
    setSocials((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="socials" value={JSON.stringify(socials)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="主播名称" htmlFor="name" hint={fieldError("name")}>
          <TextInput
            id="name"
            name="name"
            defaultValue={streamer?.name ?? ""}
            required
          />
        </Field>
        <Field
          label="Slug（留空自动生成，仅英文/数字）"
          htmlFor="slug"
          hint={fieldError("slug") || "勿填中文，否则详情页可能打不开"}
        >
          <TextInput
            id="slug"
            name="slug"
            defaultValue={streamer?.slug ?? ""}
            placeholder="例如 ws-phi"
          />
        </Field>
      </div>

      <Field label="一句话简介" htmlFor="tagline" hint={fieldError("tagline")}>
        <TextInput
          id="tagline"
          name="tagline"
          defaultValue={streamer?.tagline ?? ""}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="分类" htmlFor="category">
          <TextInput
            id="category"
            name="category"
            defaultValue={streamer?.category ?? ""}
            placeholder="娱乐 / 才艺 / 游戏"
          />
        </Field>
        <Field label="直播平台" htmlFor="platform">
          <TextInput
            id="platform"
            name="platform"
            defaultValue={streamer?.platform ?? ""}
            placeholder="抖音 / 快手 / B 站"
          />
        </Field>
      </div>

      <ImageUrlField
        label="头像图片地址"
        name="avatarUrl"
        defaultValue={streamer?.avatarUrl ?? ""}
        hint={fieldError("avatarUrl")}
      />
      <ImageUrlField
        label="封面图片地址"
        name="coverUrl"
        defaultValue={streamer?.coverUrl ?? ""}
        hint={fieldError("coverUrl")}
      />

      <Field label="直播间链接" htmlFor="platformUrl" hint={fieldError("platformUrl")}>
        <TextInput
          id="platformUrl"
          name="platformUrl"
          defaultValue={streamer?.platformUrl ?? ""}
          placeholder="https://"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="粉丝数" htmlFor="followers">
          <TextInput
            id="followers"
            name="followers"
            type="number"
            min={0}
            defaultValue={streamer?.followers ?? 0}
          />
        </Field>
        <Field label="排序值（越小越靠前）" htmlFor="sortOrder">
          <TextInput
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={streamer?.sortOrder ?? 0}
          />
        </Field>
        <Field label="状态" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={streamer?.status ?? "PUBLISHED"}
          >
            <option value="PUBLISHED">已发布</option>
            <option value="DRAFT">草稿</option>
            <option value="ARCHIVED">已归档</option>
          </Select>
        </Field>
      </div>

      <Field label="标签（逗号分隔）" htmlFor="tags">
        <TextInput
          id="tags"
          name="tags"
          defaultValue={streamer?.tags.join(", ") ?? ""}
          placeholder="唱歌, 舞蹈, 脱口秀"
        />
      </Field>

      <Field label="主播简介" htmlFor="bio">
        <TextArea
          id="bio"
          name="bio"
          defaultValue={streamer?.bio ?? ""}
          className="min-h-40"
        />
      </Field>

      <fieldset className="border border-mist-100/10 p-5">
        <legend className="px-2 text-sm font-medium text-mist-200">
          社交平台链接
        </legend>
        {fieldError("socials") ? (
          <p className="mb-3 text-xs text-red-600">{fieldError("socials")}</p>
        ) : null}
        <div className="space-y-3">
          {socials.map((social, index) => (
            <div key={index} className="flex flex-wrap gap-3">
              <TextInput
                aria-label="平台名称"
                value={social.label}
                onChange={(event) =>
                  updateSocial(index, { label: event.target.value })
                }
                placeholder="平台名称"
                className="sm:max-w-40"
              />
              <TextInput
                aria-label="链接地址"
                value={social.url}
                onChange={(event) =>
                  updateSocial(index, { url: event.target.value })
                }
                placeholder="https://"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  setSocials((rows) => rows.filter((_, i) => i !== index))
                }
                className="border border-mist-100/15 px-3 text-sm text-mist-300 hover:border-red-500/40 hover:text-red-600"
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setSocials((rows) => [...rows, { label: "", url: "" }])
          }
          className="mt-3 border border-mist-100/15 px-4 py-2 text-sm text-mist-200 hover:border-jade-500"
        >
          + 添加链接
        </button>
      </fieldset>

      <label className="flex items-center gap-3 text-sm text-mist-200">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={streamer?.featured ?? false}
          className="h-4 w-4 accent-jade-500"
        />
        设为推荐主播（在首页展示）
      </label>

      {state.error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-jade-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
