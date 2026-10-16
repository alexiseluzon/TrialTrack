import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/trial-params";

const STYLES: Record<string, string> = {
  recruiting:
    "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  active:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  completed:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  suspended:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}