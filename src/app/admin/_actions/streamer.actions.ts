"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { streamerInputSchema } from "@/domain/streamers/streamer.schema";
import { streamerService } from "@/domain/streamers/streamer.service";
import { requireAdmin } from "@/app/admin/_actions/guard";
import {
  summarizeFormErrors,
  toFieldErrors,
  type ActionResult,
} from "@/app/admin/_actions/action-result";

// Split a comma or newline separated tag string into a clean, de-duplicated list.
// 将以逗号或换行分隔的标签字符串拆分为去重后的干净列表。
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

// Parse the socials hidden field, which carries a JSON array of link objects.
// 解析社交链接隐藏字段，其内容为链接对象的 JSON 数组。
function parseSocials(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function buildInput(formData: FormData) {
  return streamerInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    bio: formData.get("bio"),
    avatarUrl: formData.get("avatarUrl"),
    coverUrl: formData.get("coverUrl"),
    platform: formData.get("platform"),
    platformUrl: formData.get("platformUrl"),
    category: formData.get("category"),
    tags: parseTags(formData.get("tags")),
    followers: formData.get("followers") ?? 0,
    socials: parseSocials(formData.get("socials")),
    status: formData.get("status") ?? "PUBLISHED",
    featured: formData.get("featured") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

export async function createStreamerAction(
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

  await streamerService.create(parsed.data);
  revalidatePath("/admin/streamers");
  revalidatePath("/streamers");
  revalidatePath("/");
  redirect("/admin/streamers");
}

export async function updateStreamerAction(
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

  await streamerService.update(id, parsed.data);
  revalidatePath("/admin/streamers");
  revalidatePath("/streamers");
  revalidatePath("/");
  redirect("/admin/streamers");
}

export async function deleteStreamerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await streamerService.delete(id);
    revalidatePath("/admin/streamers");
    revalidatePath("/streamers");
    revalidatePath("/");
  }
}
