"use server";

import { revalidatePath } from "next/cache";
import { inquiryService } from "@/domain/inquiries/inquiry.service";
import { requireAdmin } from "@/app/admin/_actions/guard";

export async function markInquiryReadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await inquiryService.markRead(id);
    revalidatePath("/admin/inquiries");
  }
}

export async function deleteInquiryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await inquiryService.delete(id);
    revalidatePath("/admin/inquiries");
  }
}
