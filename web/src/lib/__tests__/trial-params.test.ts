import { DEFAULT_FILTERS, nextOrdering, parseFilters, toSearchParams } from "../trial-params";

const params = (q: string) => new URLSearchParams(q);

describe("parseFilters", () => {
  it("returns defaults for empty input", () => {
    expect(parseFilters(params(""))).toEqual(DEFAULT_FILTERS);
  });

  it("accepts valid values", () => {
    expect(
      parseFilters(params("phase=P2&status=active&ordering=-enrollment&page=3&search=asthma")),
    ).toEqual({ search: "asthma", phase: "P2", status: "active", ordering: "-enrollment", page: 3 });
  });

  it("drops invalid values", () => {
    expect(parseFilters(params("phase=P9&status=x&ordering=password&page=-2"))).toEqual(DEFAULT_FILTERS);
  });

  it("caps search length", () => {
    expect(parseFilters(params(`search=${"a".repeat(500)}`)).search).toHaveLength(100);
  });
});

describe("toSearchParams", () => {
  it("omits default values", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("round-trips non-default filters", () => {
    const f = { search: "asthma", phase: "P2", status: "active", ordering: "enrollment", page: 2 };
    expect(parseFilters(toSearchParams(f))).toEqual(f);
  });
});

describe("nextOrdering", () => {
  it("starts ascending, then toggles", () => {
    expect(nextOrdering("-start_date", "code")).toBe("code");
    expect(nextOrdering("code", "code")).toBe("-code");
    expect(nextOrdering("-code", "code")).toBe("code");
  });
});