import { loginSchema } from "../schemas";

describe("loginSchema", () => {
  it("accepts valid input and trims username", () => {
    const r = loginSchema.safeParse({ username: "  demo ", password: "secret" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe("demo");
  });

  it("rejects empty fields", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("rejects oversized input", () => {
    expect(loginSchema.safeParse({ username: "a".repeat(151), password: "x" }).success).toBe(false);
  });
});