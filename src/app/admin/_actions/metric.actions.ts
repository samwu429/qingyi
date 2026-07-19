"use server";

import { revalidatePath } from "next/cache";
import { metricInputSchema } from "@/domain/metrics/metric.schema";
import { metricService } from "@/domain/metrics/metric.service";
import { requireAdmin } from "@/app/admin/_actions/guard";
import {
  summarizeFormErrors,
  toFieldErrors,
  type ActionResult,
} from "@/app/admin/_actions/action-result";

// Server actions for uploading and removing streamer performance records.
// Creating a record mirrors the latest fan count onto the public profile, so we
// revalidate both the admin console and the public-facing surfaces.
// 上传与删除主播运营数据的服务端 action。新增记录会把最新粉丝数同步到前台档案，
// 因此需要同时刷新后台与前台页面。
function revalidateMetricSurfaces(streamerId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/streamers/${streamerId}/edit`);
  revalidatePath("/streamers");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/streamers/${slug}`);
  }
}

export async function createMetricAction(
  streamerId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = metricInputSchema.safeParse({
    streamerId,
    period: formData.get("period"),
    recordedAt: formData.get("recordedAt"),
    followers: formData.get("followers"),
    income: formData.get("income"),
    liveMinutes: formData.get("liveMinutes"),
    viewers: formData.get("viewers"),
    comments: formData.get("comments"),
    likes: formData.get("likes"),
    yinlang: formData.get("yinlang"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error.issues);
    return {
      error: summarizeFormErrors(fieldErrors),
      fieldErrors,
    };
  }

  await metricService.create(parsed.data);
  revalidateMetricSurfaces(streamerId);
  return { error: null, ok: true };
}

export async function deleteMetricAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  const streamerId = formData.get("streamerId");
  if (typeof id === "string" && id) {
    await metricService.delete(id);
    if (typeof streamerId === "string" && streamerId) {
      revalidateMetricSurfaces(streamerId);
    } else {
      revalidatePath("/admin");
    }
  }
}
