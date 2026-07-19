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
import { parseTagList } from "@/lib/text/tags";

// Parse the socials hidden field. Drop fully blank rows so an accidental
// "+ 添加链接" click does not abort the entire save; keep partial rows so Zod
// can surface a clear Chinese error for incomplete links.
// 解析社交链接隐藏字段。丢弃全空行，避免误点「+ 添加链接」导致整表保存失败；
// 保留半填行，让 Zod 给出清晰的中文错误提示。
function parseSocials(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }
      const label =
        typeof (row as { label?: unknown }).label === "string"
          ? (row as { label: string }).label.trim()
          : "";
      const url =
        typeof (row as { url?: unknown }).url === "string"
          ? (row as { url: string }).url.trim()
          : "";
      return label !== "" || url !== "";
    });
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
    bioFormat: formData.get("bioFormat") ?? "MARKDOWN",
    avatarUrl: formData.get("avatarUrl"),
    coverUrl: formData.get("coverUrl"),
    platform: formData.get("platform"),
    platformUrl: formData.get("platformUrl"),
    category: formData.get("category"),
    tags: parseTagList(
      typeof formData.get("tags") === "string"
        ? (formData.get("tags") as string)
        : "",
    ),
    followers: formData.get("followers") ?? 0,
    socials: parseSocials(formData.get("socials")),
    status: formData.get("status") ?? "PUBLISHED",
    featured: formData.get("featured") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

function revalidateStreamerSurfaces(slug?: string) {
  revalidatePath("/admin/streamers");
  revalidatePath("/streamers");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/streamers/${slug}`);
  }
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

  const created = await streamerService.create(parsed.data);
  revalidateStreamerSurfaces(created.slug);
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

  const updated = await streamerService.update(id, parsed.data);
  revalidateStreamerSurfaces(updated.slug);
  redirect("/admin/streamers");
}

export async function deleteStreamerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await streamerService.delete(id);
    revalidateStreamerSurfaces();
  }
}
