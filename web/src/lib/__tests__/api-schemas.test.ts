import {
  ApiShapeError,
  graphqlTrialSchema,
  meSchema,
  parseApi,
  sponsorPageSchema,
  tokenPairSchema,
  trialPageSchema,
} from "../api-schemas";

const trial = {
  id: 1,
  code: "TT-00001",
  title: "ZX-101 for Asthma",
  condition: "Asthma",
  phase: "P1",
  status: "active",
  sponsor: 2,
  sponsor_name: "Acme",
  start_date: "2024-01-05",
  enrollment: 120,
};
const page = { count: 1, next: null, previous: null, results: [trial] };
const detail = {
  id: 1,
  code: "TT-00001",
  title: "T",
  condition: "Asthma",
  phase: "P1",
  status: "active",
  startDate: "2024-01-05",
  enrollment: 120,
  sponsor: { name: "Acme", country: "USA" },
  sites: [{ id: 1, name: "Manila Research Center", city: "Manila", country: "Philippines" }],
};

describe("trialPageSchema", () => {
  it("accepts a valid page", () => {
    expect(trialPageSchema.safeParse(page).success).toBe(true);
  });

  it("strips unknown fields", () => {
    const parsed = trialPageSchema.parse({ ...page, results: [{ ...trial, internal_note: "x" }] });
    expect(parsed.results[0]).not.toHaveProperty("internal_note");
  });

  it.each([
    ["missing results", { count: 1, next: null, previous: null }],
    ["string count", { ...page, count: "1" }],
    ["null enrollment", { ...page, results: [{ ...trial, enrollment: null }] }],
    ["negative enrollment", { ...page, results: [{ ...trial, enrollment: -1 }] }],
    ["not an object", null],
  ])("rejects %s", (_name, value) => {
    expect(trialPageSchema.safeParse(value).success).toBe(false);
  });
});

describe("graphqlTrialSchema", () => {
  it("accepts a trial", () => {
    expect(graphqlTrialSchema.safeParse({ data: { trial: detail } }).success).toBe(true);
  });

  it("accepts a null trial and an errors-only response", () => {
    expect(graphqlTrialSchema.safeParse({ data: { trial: null } }).success).toBe(true);
    expect(
      graphqlTrialSchema.safeParse({ data: null, errors: [{ message: "Authentication required" }] }).success,
    ).toBe(true);
  });

  it("rejects a malformed trial", () => {
    const bad = { data: { trial: { ...detail, sites: [{ id: 1 }] } } };
    expect(graphqlTrialSchema.safeParse(bad).success).toBe(false);
  });
});

describe("small schemas", () => {
  it("sponsor page", () => {
    expect(sponsorPageSchema.safeParse({ results: [{ id: 1, name: "A", country: "B" }] }).success).toBe(true);
    expect(sponsorPageSchema.safeParse({ results: [{ id: "1" }] }).success).toBe(false);
  });

  it("me", () => {
    expect(meSchema.safeParse({ username: "demo", is_staff: false }).success).toBe(true);
    expect(meSchema.safeParse({ username: "demo", is_staff: "no" }).success).toBe(false);
  });

  it("token pair", () => {
    expect(tokenPairSchema.safeParse({ access: "a", refresh: "r" }).success).toBe(true);
    expect(tokenPairSchema.safeParse({ access: "", refresh: "r" }).success).toBe(false);
  });
});

describe("parseApi", () => {
  it("returns parsed data", () => {
    expect(parseApi(trialPageSchema, page, "/api/trials").count).toBe(1);
  });

  it("throws ApiShapeError and logs field paths, never values", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const bad = { ...page, results: [{ ...trial, enrollment: "secret-value" }] };
    expect(() => parseApi(trialPageSchema, bad, "/api/trials")).toThrow(ApiShapeError);
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain("results.0.enrollment");
    expect(logged).not.toContain("secret-value");
    spy.mockRestore();
  });
});