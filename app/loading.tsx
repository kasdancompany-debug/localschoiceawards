export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-10 w-2/3 max-w-xl animate-pulse rounded-lg bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted/80" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}
