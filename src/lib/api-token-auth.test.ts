import { describe, expect, it } from "vitest";

// Pure, DB-independent behavior of the token format itself. Full create/verify/
// revoke round-trips are covered as integration tests alongside the repository
// isolation tests, since they need a live Postgres.
describe("api token format", () => {
  it("verifyApiToken rejects tokens without the expected prefix without touching the database", async () => {
    const { verifyApiToken } = await import("@/lib/api-token-auth");
    await expect(verifyApiToken("not-a-real-token")).resolves.toBeNull();
    await expect(verifyApiToken(undefined)).resolves.toBeNull();
    await expect(verifyApiToken(null)).resolves.toBeNull();
  });
});
