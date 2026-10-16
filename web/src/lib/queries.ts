import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { toSearchParams, type TrialFilters } from "./trial-params";

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