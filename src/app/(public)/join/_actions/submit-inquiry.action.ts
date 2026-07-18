"use server";

import { joinInquiryInputSchema } from "@/domain/inquiries/inquiry.schema";
import { inquiryService } from "@/domain/inquiries/inquiry.service";
import {
  toFieldErrors,
  type ActionResult,
} from "@/app/admin/_actions/action-result";

// Public submission of a join-us enquiry. Validation runs at this trust boundary
// before anything is written to the database.
// 前台「加入我们」留言提交。在此信任边界完成校验后再写入数据库。
export async function submitJoinInquiryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = joinInquiryInputSchema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      error: "请检查表单填写",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  await inquiryService.create(parsed.data);
  return { error: null, ok: true };
}
