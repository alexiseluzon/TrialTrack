import { isRealDate, toFormValues, toPayload, trialFormSchema, trialPayloadSchema } from "../trial-schema";

const valid = {
  code: "tt-100",
  title: " New trial ",
  condition: "Asthma",
  phase: "P1",
  status: "active",
  sponsor: "3",
  start_date: "2024-02-29",
  enrollment: "50",
};

describe("trialFormSchema", () => {
  it("accepts valid values", () => {
    expect(trialFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["code", "x"],
    ["code", "bad code!"],
    ["title", ""],
    ["phase", ""],
    ["sponsor", ""],
    ["start_date", "2024-02-30"],
    ["start_date", "02/03/2024"],
    ["enrollment", "-5"],
    ["enrollment", "1.5"],
    ["enrollment", "1000001"],
  ])("rejects invalid %s = %s", (field, value) => {
    expect(trialFormSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });
});

describe("isRealDate", () => {
  it("handles leap days and bad dates", () => {
    expect(isRealDate("2024-02-29")).toBe(true);
    expect(isRealDate("2023-02-29")).toBe(false);
    expect(isRealDate("0001-01-01")).toBe(false);
  });
});

describe("toPayload", () => {
  it("normalizes and converts types", () => {
    expect(toPayload(valid)).toEqual({
      code: "TT-100",
      title: "New trial",
      condition: "Asthma",
      phase: "P1",
      status: "active",
      sponsor: 3,
      start_date: "2024-02-29",
      enrollment: 50,
    });
  });

  it("output passes the payload schema", () => {
    expect(trialPayloadSchema.safeParse(toPayload(valid)).success).toBe(true);
  });

  it("payload schema rejects unknown phase", () => {
    expect(trialPayloadSchema.safeParse({ ...toPayload(valid), phase: "P9" }).success).toBe(false);
  });
});

describe("toFormValues", () => {
  it("returns empty values for create", () => {
    expect(toFormValues(null).code).toBe("");
  });

  it("stringifies numbers for edit", () => {
    const v = toFormValues({
      code: "TT-1",
      title: "T",
      condition: "C",
      phase: "P1",
      status: "active",
      sponsor: 2,
      start_date: "2024-01-01",
      enrollment: 10,
    });
    expect(v).toMatchObject({ sponsor: "2", enrollment: "10" });
  });
});