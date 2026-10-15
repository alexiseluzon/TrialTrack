import { jwtExpiry } from "../jwt";
import { makeToken } from "./helpers";

describe("jwtExpiry", () => {
  it("reads the exp claim", () => {
    expect(jwtExpiry(makeToken(1_900_000_000))).toBe(1_900_000_000);
  });

  it("returns null for malformed tokens", () => {
    expect(jwtExpiry("nope")).toBeNull();
    expect(jwtExpiry("a.b.c")).toBeNull();
  });
});