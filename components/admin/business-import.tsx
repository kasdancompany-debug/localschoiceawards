"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  commitImportAction,
  previewBusinessImportAction,
  resolveImportRowAction,
} from "@/lib/businesses/actions";
import type { DuplicateCandidate, ImportRowResolution } from "@/types/business";
import { toRoute } from "@/lib/routes";

type PreviewRow = {
  rowNumber: number;
  payload: Record<string, unknown>;
  validationErrors: string[];
  duplicates: DuplicateCandidate[];
  resolution: ImportRowResolution;
};

type BusinessImportClientProps = {
  communities: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; communityId: string; name: string; year: number }>;
};

export function BusinessImportUploader({ communities, campaigns }: BusinessImportClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-5 rounded-3xl border border-border/80 bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError(null);
        startTransition(() => {
          void (async () => {
            try {
              const result = await previewBusinessImportAction(formData);
              router.push(toRoute(`/admin/businesses/import/${result.batchId}`));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Import preview failed.");
            }
          })();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="communityId">Community</Label>
        <select
          id="communityId"
          name="communityId"
          required
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3"
          defaultValue={communities[0]?.id ?? ""}
        >
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaignId">Campaign (optional)</Label>
        <select
          id="campaignId"
          name="campaignId"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3"
          defaultValue=""
        >
          <option value="">None</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} ({campaign.year})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">CSV file</Label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 px-6">
        {pending ? "Validating…" : "Validate and preview"}
      </Button>
    </form>
  );
}

type ImportPreviewTableProps = {
  batchId: string;
  communityId: string;
  rows: PreviewRow[];
  status: string;
};

export function ImportPreviewTable({
  batchId,
  communityId,
  rows,
  status,
}: ImportPreviewTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Row</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Validation</th>
              <th className="px-4 py-3 font-medium">Duplicates</th>
              <th className="px-4 py-3 font-medium">Resolution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="border-t border-border/70 align-top">
                <td className="px-4 py-3">{row.rowNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {String(row.payload.publicName ?? row.payload.legalName ?? "—")}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.validationErrors.length
                    ? row.validationErrors.join("; ")
                    : "Valid"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.duplicates.length === 0
                    ? "None"
                    : row.duplicates
                        .map(
                          (duplicate) =>
                            `${duplicate.publicName} (${duplicate.reasons.join(", ")}, score ${duplicate.score})`,
                        )
                        .join("; ")}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-10 rounded-lg border border-input bg-transparent px-2"
                    defaultValue={row.resolution}
                    disabled={status === "completed" || pending}
                    onChange={(event) => {
                      const resolution = event.target.value as ImportRowResolution;
                      startTransition(() => {
                        void resolveImportRowAction({
                          batchId,
                          rowNumber: row.rowNumber,
                          resolution,
                        }).then(() => router.refresh());
                      });
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="import">Import as new</option>
                    <option value="skip">Skip</option>
                    <option value="merge_manual">Resolve manually later</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status !== "completed" ? (
        <Button
          type="button"
          className="h-12 px-6"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(() => {
              void (async () => {
                const result = await commitImportAction({ batchId, communityId });
                setMessage(
                  `Imported ${result.importedCount} businesses. Skipped ${result.skippedCount}. Existing records were not overwritten.`,
                );
                router.refresh();
              })();
            });
          }}
        >
          {pending ? "Importing…" : "Commit import"}
        </Button>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
