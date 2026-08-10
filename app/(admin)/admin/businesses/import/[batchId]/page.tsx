import { notFound } from "next/navigation";

import { ImportPreviewTable } from "@/components/admin/business-import";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getImportBatch } from "@/lib/businesses/import";
import type { DuplicateCandidate, ImportRowResolution } from "@/types/business";

type BatchPageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function AdminBusinessImportBatchPage({ params }: BatchPageProps) {
  await requireAdminSession("/admin/businesses/import");
  const { batchId } = await params;
  const detail = await getImportBatch(batchId);
  if (!detail) {
    notFound();
  }

  const rows = detail.rows.map((row) => ({
    rowNumber: row.row_number,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    validationErrors: row.validation_errors ?? [],
    duplicates: (row.duplicate_candidates as DuplicateCandidate[] | null) ?? [],
    resolution: row.resolution as ImportRowResolution,
  }));

  return (
    <PageShell>
      <PageIntro
        eyebrow="Import preview"
        title={detail.batch.filename}
        description={`Status: ${detail.batch.status}. Review duplicates and choose whether to import as new, skip, or resolve manually. Nothing overwrites existing businesses.`}
      />
      <div className="mt-10">
        <ImportPreviewTable
          batchId={detail.batch.id}
          communityId={detail.batch.community_id}
          rows={rows}
          status={detail.batch.status}
        />
      </div>
    </PageShell>
  );
}
