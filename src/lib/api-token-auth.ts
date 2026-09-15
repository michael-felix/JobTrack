import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { AuthedUser } from "@/lib/auth";

/**
 * Personal access tokens for the Chrome extension — a separate credential
 * type from Session (see auth.ts): bearer-authenticated instead of a cookie,
 * and only ever checked by /api/extension/* routes. Hashed the same way as
 * sessions (SHA-256; only the hash is persisted) so a database leak doesn't
 * yield usable tokens.
 */

const TOKEN_PREFIX = "jta_"; // "JobTrack API" — makes tokens recognizable in the UI/logs

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface ApiTokenSummary {
  id: string;
  label: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export async function createApiToken(userId: string, label: string): Promise<{ token: string; id: string }> {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("hex")}`;
  const created = await prisma.apiToken.create({
    data: { userId, label, tokenHash: hashToken(token) },
  });
  return { token, id: created.id };
}

export async function listApiTokens(userId: string): Promise<ApiTokenSummary[]> {
  return prisma.apiToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, lastUsedAt: true, createdAt: true },
  });
}

export async function revokeApiToken(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.apiToken.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.apiToken.delete({ where: { id } });
  return true;
}

/** Verifies a bearer token and, on success, records last-used time. Returns
 * null for a missing/unrecognized/malformed token — callers must treat that
 * as unauthenticated. */
export async function verifyApiToken(token: string | undefined | null): Promise<AuthedUser | null> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!apiToken) return null;

  await prisma.apiToken.update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } });
  return { id: apiToken.user.id, email: apiToken.user.email, name: apiToken.user.name };
}
