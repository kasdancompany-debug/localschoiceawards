import { PageShell } from "@/components/layout/page-shell";

export default function MainLoading() {
  return (
    <PageShell>
      <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-12 w-3/4 max-w-xl rounded-xl bg-muted" />
        <div className="h-6 w-full max-w-lg rounded bg-muted" />
        <div className="h-40 w-full rounded-3xl bg-muted" />
      </div>
    </PageShell>
  );
}
