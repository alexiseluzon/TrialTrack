import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toSearchParams, type TrialFilters } from "./trial-params";
import type { TrialPayload } from "./trial-schema";

export type Trial = {
  id: number;
  code: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
  sponsor: number;
  sponsor_name: string;
  start_date: string;
  enrollment: number;
};

export type TrialPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Trial[];
};

export type TrialDetail = {
  id: number;
  code: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
  startDate: string;
  enrollment: number;
  sponsor: { name: string; country: string };
  sites: { id: number; name: string; city: string; country: string }[];
};

const TRIAL_QUERY = `query Trial($code: String!) {
  trial(code: $code) {
    id code title condition phase status startDate enrollment
    sponsor { name country }
    sites { id name city country }
  }
}`;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    window.location.assign("/session/expired");
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export function useTrials(filters: TrialFilters) {
  const qs = toSearchParams(filters).toString();
  return useQuery({
    queryKey: ["trials", qs],
    queryFn: ({ signal }) => getJson<TrialPage>(`/api/trials${qs ? `?${qs}` : ""}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useTrialDetail(code: string | null) {
  return useQuery({
    queryKey: ["trial", code],
    enabled: code !== null,
    queryFn: async ({ signal }) => {
      const res = await getJson<{
        data?: { trial: TrialDetail | null };
        errors?: { message: string }[];
      }>("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: TRIAL_QUERY, variables: { code } }),
        signal,
      });
      if (res.errors?.length) throw new Error(res.errors[0].message);
      if (!res.data?.trial) throw new Error("Trial not found");
      return res.data.trial;
    },
  });
}

export type Sponsor = { id: number; name: string; country: string };

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) =>
      (await getJson<{ results: Sponsor[] }>("/api/sponsors", { signal })).results,
  });
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;

  constructor(status: number, fields: Record<string, string[]> = {}) {
    super(`Request failed (${status})`);
    this.status = status;
    this.fields = fields;
  }
}

function toFieldErrors(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) out[key] = value.map(String);
  }
  return out;
}

async function mutate<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.assign("/session/expired");
    throw new ApiError(401);
  }
  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    throw new ApiError(res.status, toFieldErrors(parsed));
  }
  return res.status === 204 ? null : ((await res.json()) as T);
}

function useInvalidateTrials() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["trials"] }),
      qc.invalidateQueries({ queryKey: ["trial"] }),
    ]);
}

export function useSaveTrial() {
  const invalidate = useInvalidateTrials();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: TrialPayload }) =>
      mutate<Trial>(id ? `/api/trials/${id}` : "/api/trials", id ? "PATCH" : "POST", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTrial() {
  const invalidate = useInvalidateTrials();
  return useMutation({
    mutationFn: (id: number) => mutate<null>(`/api/trials/${id}`, "DELETE"),
    onSuccess: invalidate,
  });
}