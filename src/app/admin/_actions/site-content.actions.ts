"use server";

import { revalidatePath } from "next/cache";
import { siteContentService } from "@/domain/site/site-content.service";
import {
  siteContentRegistry,
  type SiteContentKey,
} from "@/domain/site/site-content.types";
import { requireAdmin } from "@/app/admin/_actions/guard";
import type { ActionResult } from "@/app/admin/_actions/action-result";

// Public routes whose content is affected by each editable settings key. Used to
// revalidate exactly the impacted pages after a save.
// 每个可编辑设置键所影响的公开路由，用于在保存后精确重新验证受影响页面。
const affectedPaths: Record<SiteContentKey, string[]> = {
  home: ["/"],
  about: ["/about"],
  contact: ["/contact"],
  join: ["/join"],
};

// Persist a section of editable page content submitted as a JSON payload. The
// value is validated against the section schema inside the service layer.
// 持久化以 JSON 载荷提交的可编辑页面内容区块。数值在服务层依据区块 schema 校验。
export async function saveSiteContentAction(
  key: SiteContentKey,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  if (!(key in siteContentRegistry)) {
    return { error: "未知的内容分区" };
  }

  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { error: "提交内容无效" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "提交内容格式错误" };
  }

  const validated = siteContentRegistry[key].schema.safeParse(parsedJson);
  if (!validated.success) {
    return { error: "内容校验失败，请检查各字段长度与格式" };
  }

  await siteContentService.save(key, validated.data as never);

  for (const path of affectedPaths[key]) {
    revalidatePath(path);
  }
  return { error: null, ok: true };
}
