import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createApplication, getApplication, listApplications } from "@/lib/repositories/applications";

/**
 * Proves the row-scoping invariant described in docs/ARCHITECTURE.md: every
 * repository function takes userId and a caller can never read another
 * user's Application rows through it.
 *
 * Requires a live Postgres (e.g. `docker compose up db`) reachable via
 * DATABASE_URL. Run with: RUN_DB_TESTS=1 npm test
 */
const runIfDb = process.env.RUN_DB_TESTS ? describe : describe.skip;

runIfDb("application repository row-level isolation", () => {
  let userA: { id: string };
  let userB: { id: string };

  beforeAll(async () => {
    userA = await prisma.user.create({
      data: { email: `user-a-${Date.now()}@test.local`, passwordHash: "x" },
    });
    userB = await prisma.user.create({
      data: { email: `user-b-${Date.now()}@test.local`, passwordHash: "x" },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await prisma.$disconnect();
  });

  it("never returns another user's applications from listApplications", async () => {
    await createApplication(userA.id, { jobTitle: "A's job", company: "Acme" });
    await createApplication(userB.id, { jobTitle: "B's job", company: "Globex" });

    const asA = await listApplications(userA.id, "DATE_CAPTURED_DESC");
    const asB = await listApplications(userB.id, "DATE_CAPTURED_DESC");

    expect(asA.every((app) => app.userId === userA.id)).toBe(true);
    expect(asB.every((app) => app.userId === userB.id)).toBe(true);
    expect(asA.some((app) => app.jobTitle === "B's job")).toBe(false);
  });

  it("returns null when fetching another user's application by id", async () => {
    const application = await createApplication(userA.id, { jobTitle: "Secret", company: "Acme" });
    const asOwner = await getApplication(userA.id, application.id);
    const asOther = await getApplication(userB.id, application.id);

    expect(asOwner).not.toBeNull();
    expect(asOther).toBeNull();
  });
});
