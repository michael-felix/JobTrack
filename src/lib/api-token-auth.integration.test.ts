import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createApiToken, listApiTokens, revokeApiToken, verifyApiToken } from "@/lib/api-token-auth";

/** Requires a live Postgres — run with: RUN_DB_TESTS=1 npm test */
const runIfDb = process.env.RUN_DB_TESTS ? describe : describe.skip;

runIfDb("api token lifecycle", () => {
  let user: { id: string };

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: `token-user-${Date.now()}@test.local`, passwordHash: "x" },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it("verifies a freshly created token and resolves the owning user", async () => {
    const { token } = await createApiToken(user.id, "Extension on laptop");
    const resolved = await verifyApiToken(token);
    expect(resolved?.id).toBe(user.id);
  });

  it("never returns the plaintext token from listApiTokens", async () => {
    await createApiToken(user.id, "Second token");
    const tokens = await listApiTokens(user.id);
    expect(tokens.length).toBeGreaterThan(0);
    for (const t of tokens) {
      expect(t).not.toHaveProperty("tokenHash");
      expect(t).not.toHaveProperty("token");
    }
  });

  it("rejects a revoked token", async () => {
    const { token, id } = await createApiToken(user.id, "To be revoked");
    expect(await verifyApiToken(token)).not.toBeNull();

    const revoked = await revokeApiToken(user.id, id);
    expect(revoked).toBe(true);
    expect(await verifyApiToken(token)).toBeNull();
  });

  it("cannot be revoked by a different user", async () => {
    const other = await prisma.user.create({
      data: { email: `other-token-user-${Date.now()}@test.local`, passwordHash: "x" },
    });
    const { token, id } = await createApiToken(user.id, "Owned by first user");

    const revokedByOther = await revokeApiToken(other.id, id);
    expect(revokedByOther).toBe(false);
    expect(await verifyApiToken(token)).not.toBeNull();

    await prisma.user.delete({ where: { id: other.id } });
  });
});
