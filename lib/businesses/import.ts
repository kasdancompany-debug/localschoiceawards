import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { parseCsv, normalizeImportHeaders } from "@/lib/businesses/csv";
import { detectBusinessDuplicates } from "@/lib/businesses/service";
import { ensureUniqueBusinessSlug, slugifyBusinessName } from "@/lib/businesses/duplicates";
import { businessImportRowSchema } from "@/lib/validation/businesses";
import type { DuplicateCandidate, ImportRowResolution } from "@/types/business";
import type { Json } from "@/types/database";

export type ImportPreviewRow = {
  rowNumber: number;
  payload: Record<string, unknown>;
  validationErrors: string[];
  duplicates: DuplicateCandidate[];
  resolution: ImportRowResolution;
};

export type ImportPreviewResult = {
  filename: string;
  rows: ImportPreviewRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
};

export async function previewBusinessCsvImport(input: {
  communityId: string;
  campaignId?: string | null;
  filename: string;
  csvText: string;
}): Promise<ImportPreviewResult> {
  const parsed = parseCsv(input.csvText);
  const existingSlugs = new Set<string>();
  const rows: ImportPreviewRow[] = [];

  for (let index = 0; index < parsed.rows.length; index += 1) {
    const raw = normalizeImportHeaders(parsed.rows[index] ?? {});
    const categorySlugs =
      typeof raw.categorySlugs === "string" && raw.categorySlugs
        ? raw.categorySlugs.split(/[|;,]/).map((value) => value.trim()).filter(Boolean)
        : [];

    const candidate = {
      ...raw,
      categorySlugs,
      serviceAreaBusiness:
        String(raw.serviceAreaBusiness ?? "").toLowerCase() === "true" ||
        String(raw.serviceAreaBusiness ?? "") === "1",
    };

    const validated = businessImportRowSchema.safeParse(candidate);
    const validationErrors = validated.success
      ? []
      : validated.error.issues.map((issue) => issue.message);

    const payload: Record<string, unknown> = validated.success
      ? { ...validated.data }
      : { ...candidate };
    const publicName = String(raw.publicName ?? validated.data?.publicName ?? "");

    const duplicates = publicName
      ? await detectBusinessDuplicates(
          {
            publicName,
            phone: String(raw.primaryPhone || raw.phone || "") || null,
            websiteUrl: String(raw.websiteUrl || raw.websiteLocationUrl || "") || null,
            addressLine1: String(raw.addressLine1 || "") || null,
            addressLine2: String(raw.addressLine2 || "") || null,
            city: String(raw.city || "") || null,
            administrativeRegionCode: String(raw.administrativeRegionCode || "") || null,
            postalCode: String(raw.postalCode || "") || null,
            countryCode: String(raw.countryCode || "") || null,
          },
          input.communityId,
        )
      : [];

    if (validated.success) {
      const desiredSlug = validated.data.slug || slugifyBusinessName(validated.data.publicName);
      existingSlugs.add(desiredSlug);
    }

    rows.push({
      rowNumber: index + 1,
      payload,
      validationErrors,
      duplicates,
      resolution: duplicates.length > 0 ? "pending" : validated.success ? "import" : "skip",
    });
  }

  return {
    filename: input.filename,
    rows,
    validCount: rows.filter((row) => row.validationErrors.length === 0).length,
    invalidCount: rows.filter((row) => row.validationErrors.length > 0).length,
    duplicateCount: rows.filter((row) => row.duplicates.length > 0).length,
  };
}

export async function persistImportPreview(input: {
  communityId: string;
  campaignId?: string | null;
  importedBy: string;
  preview: ImportPreviewResult;
}): Promise<{ batchId: string }> {
  const supabase = createSupabaseAdminClient();
  const { data: batch, error } = await supabase
    .from("business_import_batches")
    .insert({
      community_id: input.communityId,
      campaign_id: input.campaignId ?? null,
      imported_by: input.importedBy,
      filename: input.preview.filename,
      status: "preview",
      row_count: input.preview.rows.length,
      duplicate_count: input.preview.duplicateCount,
      notes: "Preview created. No businesses were overwritten.",
    })
    .select("id")
    .single();

  if (error || !batch) {
    throw new Error(error?.message ?? "Unable to create import batch.");
  }

  if (input.preview.rows.length > 0) {
    const { error: rowsError } = await supabase.from("business_import_rows").insert(
      input.preview.rows.map((row) => ({
        batch_id: batch.id,
        row_number: row.rowNumber,
        payload: row.payload as Json,
        validation_errors: row.validationErrors,
        duplicate_candidates: row.duplicates as unknown as Json,
        resolution: row.resolution,
      })),
    );
    if (rowsError) {
      throw new Error(rowsError.message);
    }
  }

  return { batchId: batch.id };
}

export async function updateImportRowResolution(input: {
  batchId: string;
  rowNumber: number;
  resolution: ImportRowResolution;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("business_import_rows")
    .update({ resolution: input.resolution })
    .eq("batch_id", input.batchId)
    .eq("row_number", input.rowNumber);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Commit import rows marked `import`. Never silently overwrites existing businesses.
 * Duplicate rows must be explicitly set to import (manual override) or skip.
 */
export async function commitBusinessImport(input: {
  batchId: string;
  communityId: string;
  actorUserId: string;
}): Promise<{ importedCount: number; skippedCount: number }> {
  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("business_import_rows")
    .select("*")
    .eq("batch_id", input.batchId)
    .order("row_number");

  if (error || !rows) {
    throw new Error(error?.message ?? "Import rows not found.");
  }

  const { data: existingBusinesses } = await supabase
    .from("businesses")
    .select("slug")
    .is("deleted_at", null);
  const slugSet = new Set((existingBusinesses ?? []).map((row) => row.slug.toLowerCase()));

  let importedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    if (row.resolution !== "import") {
      skippedCount += 1;
      continue;
    }

    const parsed = businessImportRowSchema.safeParse(row.payload);
    if (!parsed.success) {
      skippedCount += 1;
      continue;
    }

    const duplicates = (row.duplicate_candidates as DuplicateCandidate[] | null) ?? [];
    // Explicit import on a duplicate row is allowed only as a manual override.
    // We still never update/overwrite an existing business record.
    if (duplicates.length > 0 && row.resolution !== "import") {
      skippedCount += 1;
      continue;
    }

    const values = parsed.data;
    const slug = ensureUniqueBusinessSlug(values.slug || values.publicName, slugSet);
    slugSet.add(slug);

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        legal_name: values.legalName,
        public_name: values.publicName,
        slug,
        description: values.description || "",
        website_url: values.websiteUrl || null,
        primary_phone: values.primaryPhone || null,
        primary_email: values.primaryEmail || null,
        status: "approved",
      })
      .select("id")
      .single();

    if (businessError || !business) {
      skippedCount += 1;
      continue;
    }

    const locationSlug = slugifyBusinessName(values.locationName || values.publicName);
    const { data: location, error: locationError } = await supabase
      .from("business_locations")
      .insert({
        business_id: business.id,
        community_id: input.communityId,
        location_name: values.locationName || values.publicName,
        slug: locationSlug,
        address_line_1: values.addressLine1 || null,
        address_line_2: values.addressLine2 || null,
        city: values.city || null,
        administrative_region_code: values.administrativeRegionCode || null,
        country_code: values.countryCode || null,
        postal_code: values.postalCode || null,
        phone: values.phone || values.primaryPhone || null,
        email: values.email || values.primaryEmail || null,
        website_url: values.websiteLocationUrl || values.websiteUrl || null,
        service_area_business: values.serviceAreaBusiness ?? false,
        active: true,
      })
      .select("id")
      .single();

    if (locationError || !location) {
      skippedCount += 1;
      continue;
    }

    if (values.categorySlugs?.length) {
      const { data: categories } = await supabase
        .from("campaign_categories")
        .select("id, local_slug, master_categories(slug)")
        .eq("active", true);

      const matching = (categories ?? []).filter((category) => {
        const master = category.master_categories as unknown as { slug: string } | null;
        const slugValue = category.local_slug || master?.slug;
        return slugValue ? values.categorySlugs?.includes(slugValue) : false;
      });

      if (matching.length > 0) {
        await supabase.from("business_category_assignments").insert(
          matching.map((category) => ({
            business_location_id: location.id,
            campaign_category_id: category.id,
            status: "approved",
            assigned_by: input.actorUserId,
          })),
        );
      }
    }

    await supabase
      .from("business_import_rows")
      .update({ resulting_business_id: business.id })
      .eq("id", row.id);

    importedCount += 1;
  }

  await supabase
    .from("business_import_batches")
    .update({
      status: "completed",
      imported_count: importedCount,
      skipped_count: skippedCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.batchId);

  return { importedCount, skippedCount };
}

export async function listImportBatches(communityId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("business_import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (communityId) {
    query = query.eq("community_id", communityId);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getImportBatch(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: batch } = await supabase
    .from("business_import_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) {
    return null;
  }
  const { data: rows } = await supabase
    .from("business_import_rows")
    .select("*")
    .eq("batch_id", batchId)
    .order("row_number");
  return { batch, rows: rows ?? [] };
}
