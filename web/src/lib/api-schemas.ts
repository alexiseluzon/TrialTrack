import { z } from "zod";

// Source of truth for API response shapes. Types are inferred from these schemas.
// Unknown fields are stripped, so the API can add fields without breaking the UI.

export class ApiShapeError extends Error {
  constructor(label: string) {
    super(`Unexpected response from ${label}`);
    this.name = "ApiShapeError";
  }
}

/** Validates data. On failure it logs field paths only, never values (responses may be sensitive). */
export function parseApi<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(
      `Unexpected API response (${label}):`,
      result.error.issues.map((i) => i.path.join(".") || "(root)"),
    );
    throw new ApiShapeError(label);
  }
  return result.data;
}

export const trialSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  title: z.string(),
  condition: z.string(),
  phase: z.string(),
  status: z.string(),
  sponsor: z.number().int(),
  sponsor_name: z.string(),
  start_date: z.string(),
  enrollment: z.number().int().nonnegative(),
  can_edit: z.boolean().default(false),
});

export const trialPageSchema = z.object({
  count: z.number().int().nonnegative(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(trialSchema),
});

export const sponsorSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  country: z.string(),
});

export const sponsorPageSchema = z.object({ results: z.array(sponsorSchema) });

export const trialDetailSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  title: z.string(),
  condition: z.string(),
  phase: z.string(),
  status: z.string(),
  startDate: z.string(),
  enrollment: z.number().int().nonnegative(),
  sponsor: z.object({ name: z.string(), country: z.string() }),
  sites: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      city: z.string(),
      country: z.string(),
    }),
  ),
});

export const graphqlTrialSchema = z.object({
  data: z.object({ trial: trialDetailSchema.nullable() }).nullable().optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export const meSchema = z.object({
  username: z.string(),
  is_staff: z.boolean(),
  is_demo: z.boolean().default(false),
});

export const tokenPairSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

export const refreshResponseSchema = z.object({ access: z.string().min(1) });

export type Trial = z.infer<typeof trialSchema>;
export type TrialPage = z.infer<typeof trialPageSchema>;
export type Sponsor = z.infer<typeof sponsorSchema>;
export type TrialDetail = z.infer<typeof trialDetailSchema>;
export type Me = z.infer<typeof meSchema>;