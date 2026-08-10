"use server";

import { getOptionalUser } from "@/lib/auth/session";
import { createMissingBusinessSubmission } from "@/lib/businesses/service";
import {
  commitBusinessImport,
  persistImportPreview,
  previewBusinessCsvImport,
  updateImportRowResolution,
} from "@/lib/businesses/import";
import { createBusinessMediaUploadUrl, registerBusinessMedia } from "@/lib/businesses/storage";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { missingBusinessSubmissionSchema } from "@/lib/validation/businesses";
import { requireAdminSession } from "@/lib/auth/session";
import type { ImportRowResolution } from "@/types/business";

export type BusinessFormState = {
  ok: boolean;
  message?: string;
};

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function submitMissingBusinessAction(
  _prev: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const parsed = missingBusinessSubmissionSchema.safeParse({
    businessName: formData.get("businessName"),
    categoryId: formData.get("categoryId") || "",
    address: formData.get("address") || "",
    websiteUrl: formData.get("websiteUrl") || "",
    phone: formData.get("phone") || "",
    submitterEmail: formData.get("submitterEmail"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const campaignId = String(formData.get("campaignId") ?? "");
  if (!campaignId) {
    return { ok: false, message: "No active campaign is available for submissions." };
  }

  const user = await getOptionalUser();
  const result = await createMissingBusinessSubmission({
    campaignId,
    submittedByUserId: user?.id ?? null,
    businessName: parsed.data.businessName,
    categoryId: parsed.data.categoryId || null,
    address: parsed.data.address || null,
    websiteUrl: parsed.data.websiteUrl || null,
    phone: parsed.data.phone || null,
    submitterEmail: parsed.data.submitterEmail,
  });

  return { ok: result.ok, message: result.message };
}

export async function previewBusinessImportAction(formData: FormData) {
  const session = await requireAdminSession("/admin/businesses/import");
  const communityId = String(formData.get("communityId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "") || null;
  const file = formData.get("file");

  if (!communityId) {
    throw new Error("Community is required.");
  }
  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const csvText = await file.text();
  const preview = await previewBusinessCsvImport({
    communityId,
    campaignId,
    filename: file.name,
    csvText,
  });

  const { batchId } = await persistImportPreview({
    communityId,
    campaignId,
    importedBy: session.userId,
    preview,
  });

  return { batchId, preview };
}

export async function resolveImportRowAction(input: {
  batchId: string;
  rowNumber: number;
  resolution: ImportRowResolution;
}) {
  await requireAdminSession("/admin/businesses/import");
  await updateImportRowResolution(input);
  return { ok: true };
}

export async function commitImportAction(input: {
  batchId: string;
  communityId: string;
}) {
  const session = await requireAdminSession("/admin/businesses/import");
  return commitBusinessImport({
    batchId: input.batchId,
    communityId: input.communityId,
    actorUserId: session.userId,
  });
}

export async function createMediaUploadAction(input: {
  businessId: string;
  filename: string;
  contentType: string;
}) {
  await requireAdminSession("/admin");
  return createBusinessMediaUploadUrl(input);
}

export async function registerMediaAction(input: {
  businessId: string;
  businessLocationId?: string | null;
  storagePath: string;
  mediaType: "logo" | "photo" | "cover";
  altText?: string;
}) {
  await requireAdminSession("/admin");
  const id = await registerBusinessMedia({ ...input, approve: true });
  return { id };
}
