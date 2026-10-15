import { accessCookieOptions, refreshCookieOptions } from "../cookies";
import { makeToken } from "./helpers";

describe("cookie options", () => {
  const now = 1_800_000_000_000;

  it("derives maxAge from token expiry", () => {
    const o = accessCookieOptions(makeToken(now / 1000 + 120), now, true);
    expect(o.maxAge).toBe(120);
    expect(o).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  });

  it("never returns a negative maxAge", () => {
    expect(accessCookieOptions(makeToken(now / 1000 - 50), now, false).maxAge).toBe(0);
  });

  it("refresh cookie is httpOnly with a 1-day maxAge", () => {
    expect(refreshCookieOptions(true)).toMatchObject({ httpOnly: true, maxAge: 86400 });
  });
});