export const PHASES = ["P1", "P2", "P3", "P4"] as const;
export const STATUSES = ["recruiting", "active", "completed", "suspended"] as const;
export const SORT_FIELDS = ["code", "title", "phase", "status", "start_date", "enrollment"] as const;

export const PHASE_LABELS: Record<string, string> = {
  P1: "Phase 1",
  P2: "Phase 2",
  P3: "Phase 3",
  P4: "Phase 4",
};
export const STATUS_LABELS: Record<string, string> = {
  recruiting: "Recruiting",
  active: "Active, not recruiting",
  completed: "Completed",
  suspended: "Suspended",
};

export type TrialFilters = {
  search: string;
  phase: string;
  status: string;
  ordering: string;
  page: number;
};

export const DEFAULT_FILTERS: TrialFilters = {
  search: "",
  phase: "",
  status: "",
  ordering: "-start_date",
  page: 1,
};

type ParamsLike = { get(name: string): string | null };

const oneOf = (list: readonly string[], value: string) => (list.includes(value) ? value : "");

/** Validates untrusted URL input against allowlists. */
export function parseFilters(params: ParamsLike): TrialFilters {
  const ordering = params.get("ordering") ?? "";
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    search: (params.get("search") ?? "").slice(0, 100),
    phase: oneOf(PHASES, params.get("phase") ?? ""),
    status: oneOf(STATUSES, params.get("status") ?? ""),
    ordering: oneOf(SORT_FIELDS, ordering.replace(/^-/, "")) ? ordering : DEFAULT_FILTERS.ordering,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

/** Only non-default values, so URLs stay clean. */
export function toSearchParams(f: TrialFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set("search", f.search);
  if (f.phase) p.set("phase", f.phase);
  if (f.status) p.set("status", f.status);
  if (f.ordering !== DEFAULT_FILTERS.ordering) p.set("ordering", f.ordering);
  if (f.page > 1) p.set("page", String(f.page));
  return p;
}

/** Click cycle: ascending, then descending, then ascending again. */
export function nextOrdering(current: string, field: string): string {
  return current === field ? `-${field}` : field;
}