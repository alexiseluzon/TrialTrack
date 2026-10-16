import { z } from "zod";

import { PHASES, STATUSES } from "./trial-params";

const MAX_ENROLLMENT = 1_000_000;

export function isRealDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1900 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** UI form: every field is a string (native inputs). */
export const trialFormSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9-]{3,20}$/, "3-20 letters, numbers or dashes"),
  title: z.string().trim().min(1, "Title is required").max(300, "Max 300 characters"),
  condition: z.string().trim().min(1, "Condition is required").max(200, "Max 200 characters"),
  phase: z.string().min(1, "Choose a phase"),
  status: z.string().min(1, "Choose a status"),
  sponsor: z.string().min(1, "Choose a sponsor"),
  start_date: z.string().refine(isRealDate, "Enter a valid date"),
  enrollment: z
    .string()
    .regex(/^\d+$/, "Whole number, 0 or more")
    .refine((v) => Number(v) <= MAX_ENROLLMENT, "Max 1,000,000"),
});

/** Wire format, also used by the BFF to re-validate untrusted input. */
export const trialPayloadSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]{3,20}$/),
  title: z.string().min(1).max(300),
  condition: z.string().min(1).max(200),
  phase: z.enum(PHASES),
  status: z.enum(STATUSES),
  sponsor: z.number().int().positive(),
  start_date: z.string().refine(isRealDate),
  enrollment: z.number().int().min(0).max(MAX_ENROLLMENT),
});

export type TrialFormValues = z.infer<typeof trialFormSchema>;
export type TrialPayload = z.infer<typeof trialPayloadSchema>;

type TrialLike = {
  code: string;
  title: string;
  condition: string;
  phase: string;
  status: string;
  sponsor: number;
  start_date: string;
  enrollment: number;
};

export function toFormValues(trial: TrialLike | null): TrialFormValues {
  if (!trial) {
    return { code: "", title: "", condition: "", phase: "", status: "", sponsor: "", start_date: "", enrollment: "" };
  }
  return {
    code: trial.code,
    title: trial.title,
    condition: trial.condition,
    phase: trial.phase,
    status: trial.status,
    sponsor: String(trial.sponsor),
    start_date: trial.start_date,
    enrollment: String(trial.enrollment),
  };
}

export function toPayload(values: TrialFormValues): TrialPayload {
  return trialPayloadSchema.parse({
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    condition: values.condition.trim(),
    phase: values.phase,
    status: values.status,
    sponsor: Number(values.sponsor),
    start_date: values.start_date,
    enrollment: Number(values.enrollment),
  });
}