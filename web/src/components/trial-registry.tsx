"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { TrialDetailSheet } from "@/components/trial-detail-sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  PHASES,
  PHASE_LABELS,
  STATUSES,
  STATUS_LABELS,
  nextOrdering,
  parseFilters,
  toSearchParams,
  type TrialFilters,
} from "@/lib/trial-params";
import { TrialFormDialog } from "@/components/trial-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError, useDeleteTrial, useTrials, type Trial } from "@/lib/queries";

const PAGE_SIZE = 20;
const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: PHASE_LABELS[p] }));
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

const HEADERS: { field?: string; label: string; right?: boolean }[] = [
  { field: "code", label: "Code" },
  { field: "title", label: "Title" },
  { label: "Sponsor" },
  { field: "phase", label: "Phase" },
  { field: "status", label: "Status" },
  { field: "start_date", label: "Start date" },
  { field: "enrollment", label: "Enrollment", right: true },
];

function SortHead({
  field,
  label,
  ordering,
  right,
  onSort,
}: {
  field: string;
  label: string;
  ordering: string;
  right?: boolean;
  onSort: (field: string) => void;
}) {
  const active = ordering.replace(/^-/, "") === field;
  const desc = ordering.startsWith("-");
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;
  return (
    <TableHead
      aria-sort={active ? (desc ? "descending" : "ascending") : "none"}
      className={right ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 rounded-sm font-medium outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </TableHead>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TrialRegistry({ isStaff }: { isStaff: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [q, setQ] = useState(filters.search);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<{ trial: Trial | null } | null>(null);
  const [deleting, setDeleting] = useState<Trial | null>(null);
  const remove = useDeleteTrial();
  const columns = HEADERS.length + (isStaff ? 1 : 0);
  const { data, isPending, isError, isFetching, refetch } = useTrials(filters);

  const update = useCallback(
    (patch: Partial<TrialFilters>) => {
      const qs = toSearchParams({ ...filters, page: 1, ...patch }).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  // Debounced search -> URL
  useEffect(() => {
    if (q.trim() === filters.search) return;
    const timer = setTimeout(() => update({ search: q.trim() }), 300);
    return () => clearTimeout(timer);
  }, [q, filters.search, update]);

  useEffect(() => {
    if (isError) toast.error("Could not load trials. Check your connection and retry.");
  }, [isError]);

  const hasFilters = Boolean(filters.search || filters.phase || filters.status || q);
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const from = count === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(filters.page * PAGE_SIZE, count);

  const clearFilters = () => {
    setQ("");
    update({ search: "", phase: "", status: "" });
  };

  const confirmDelete = () => {
    const target = deleting;
    if (!target) return;
    setDeleting(null);
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Deleted ${target.code}`);
        // Deleting the last row of a page would leave an out-of-range page.
        if (data && data.results.length === 1 && filters.page > 1) update({ page: filters.page - 1 });
      },
      onError: (err) =>
        toast.error(
          err instanceof ApiError && err.status === 403
            ? "Admin access required."
            : "Could not delete trial. Try again.",
        ),
    });
  };

  return (
    <section className="space-y-4" aria-label="Trial registry">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search trials"
            placeholder="Search code, title, condition, sponsor"
            maxLength={100}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterSelect label="Phase" value={filters.phase} options={PHASE_OPTIONS} onChange={(phase) => update({ phase })} />
        <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(status) => update({ status })} />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X aria-hidden /> Clear filters
          </Button>
        )}
        {isStaff && (
          <Button className="sm:ml-auto" onClick={() => setForm({ trial: null })}>
            <Plus aria-hidden /> New trial
          </Button>
        )}
      </div>

      {isError && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <span>Could not load trials. The API may be waking up.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div
        className={`rounded-lg border bg-card shadow-sm transition-opacity ${isFetching && !isPending ? "opacity-60" : ""}`}
        aria-busy={isFetching}
      >
        <Table>
          <TableCaption className="sr-only">Clinical trial registry (fake demo data)</TableCaption>
          <TableHeader>
            <TableRow>
              {HEADERS.map((h) =>
                h.field ? (
                  <SortHead
                    key={h.label}
                    field={h.field}
                    label={h.label}
                    right={h.right}
                    ordering={filters.ordering}
                    onSort={(f) => update({ ordering: nextOrdering(filters.ordering, f) })}
                  />
                ) : (
                  <TableHead key={h.label}>{h.label}</TableHead>
                ),
              )}
              {isStaff && (
                <TableHead className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {HEADERS.map((h) => (
                    <TableCell key={h.label}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {isStaff && (
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {data && data.results.length === 0 && !isError && (
              <TableRow>
                <TableCell colSpan={columns} className="h-24 text-center text-muted-foreground">
                  No trials match your filters.
                </TableCell>
              </TableRow>
            )}

            {data?.results.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.code}</TableCell>
                <TableCell className="max-w-xs">
                  <button
                    type="button"
                    onClick={() => setSelected(t.code)}
                    className="rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {t.title}
                  </button>
                </TableCell>
                <TableCell>{t.sponsor_name}</TableCell>
                <TableCell>{PHASE_LABELS[t.phase] ?? t.phase}</TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>{formatDate(t.start_date)}</TableCell>
                <TableCell className="text-right tabular-nums">{t.enrollment.toLocaleString("en-US")}</TableCell>
                {isStaff && (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button variant="ghost" size="icon" aria-label={`Edit ${t.code}`} onClick={() => setForm({ trial: t })} />
                          }
                        >
                          <Pencil aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button variant="ghost" size="icon" aria-label={`Delete ${t.code}`} onClick={() => setDeleting(t)} />
                          }
                        >
                          <Trash2 aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {data ? (count === 0 ? "0 results" : `${from}–${to} of ${count}`) : "\u00A0"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>
            Previous
          </Button>
          <span className="text-sm tabular-nums">
            Page {filters.page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={filters.page >= totalPages} onClick={() => update({ page: filters.page + 1 })}>
            Next
          </Button>
        </div>
      </div>

      {form && <TrialFormDialog trial={form.trial} onClose={() => setForm(null)} />}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the trial and its sites. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TrialDetailSheet code={selected} onClose={() => setSelected(null)} />
    </section>
  );
}