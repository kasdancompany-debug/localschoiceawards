import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({
  from,
  to,
  action,
}: {
  from: string;
  to: string;
  action?: string;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
