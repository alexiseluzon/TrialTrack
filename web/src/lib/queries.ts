import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import {
  graphqlTrialSchema,
  parseApi,
  sponsorPageSchema,
  trialPageSchema,
  type Sponsor,
  type Trial,
  type TrialDetail,
  type TrialPage,
} from "./api-schemas";
import { toSearchParams, type TrialFilters } from "./trial-params";
import type { TrialPayload } from "./trial-schema";

export type { Sponsor, Trial, TrialDetail, TrialPage };

const TRIAL_QUERY = `query Trial($code: String!) {
  trial(code: $code) {
    id code title condition phase status startDate enrollment
    sponsor { name country }
    sites { id name city country }
  }
}`;

// Full page load on purpose: /session/expired is a route handler that clears cookies, not a client route.
function endSession() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/session/expired");
}

async function getJson<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    endSession();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return parseApi(schema, await res.json(), url.split("?")[0]);
}

export function useTrials(filters: TrialFilters) {
  const qs = toSearchParams(filters).toString();
  return useQuery({
    queryKey: ["trials", qs],
    queryFn: ({ signal }) => getJson(`/api/trials${qs ? `?${qs}` : ""}`, trialPageSchema, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useTrialDetail(code: string | null) {
  return useQuery({
    queryKey: ["trial", code],
    enabled: code !== null,
    queryFn: async ({ signal }) => {
      const res = await getJson("/api/graphql", graphqlTrialSchema, {
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

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) =>
      (await getJson("/api/sponsors", sponsorPageSchema, { signal })).results,
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

// Success bodies are not used by the UI, so only errors are parsed.
async function mutate(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    endSession();
    throw new ApiError(401);
  }
  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    throw new ApiError(res.status, toFieldErrors(parsed));
  }
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
      mutate(id ? `/api/trials/${id}` : "/api/trials", id ? "PATCH" : "POST", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTrial() {
  const invalidate = useInvalidateTrials();
  return useMutation({
    mutationFn: (id: number) => mutate(`/api/trials/${id}`, "DELETE"),
    onSuccess: invalidate,
  });
}