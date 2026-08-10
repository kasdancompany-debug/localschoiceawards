import { PageShell } from "@/components/layout/page-shell";

export default function CommunityLoading() {
  return (
    <PageShell>
      <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading community">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-14 w-2/3 max-w-xl rounded-xl bg-muted" />
        <div className="h-6 w-48 rounded-full bg-muted" />
        <div className="h-48 w-full rounded-3xl bg-muted" />
      </div>
    </PageShell>
  );
}
