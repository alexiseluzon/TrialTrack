export const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "e2e-Demo-Pass-123";

export const MEMBER = { username: "demo", password: PASSWORD, file: "e2e/.auth/member.json" };
export const ADMIN = { username: "demo_admin", password: PASSWORD, file: "e2e/.auth/admin.json" };