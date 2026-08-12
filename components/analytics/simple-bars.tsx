export function SimpleBars({
  rows,
  valueKey = "value",
  labelKey = "label",
}: {
  rows: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] ?? 0)));
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const value = Number(row[valueKey] ?? 0);
        const width = `${Math.round((value / max) * 100)}%`;
        return (
          <li key={String(row[labelKey])}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span>{String(row[labelKey])}</span>
              <span className="tabular-nums text-muted-foreground">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/80" style={{ width }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
