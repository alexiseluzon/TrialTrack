import { formatDate } from "../format";

describe("formatDate", () => {
  it("formats date-only strings in Asia/Manila", () => {
    expect(formatDate("2024-01-05")).toBe("Jan 5, 2024");
  });

  it("returns a dash for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});