import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, type AuthedUser } from "@/lib/auth";
import { verifyApiToken } from "@/lib/api-token-auth";

/** Resolves the authenticated user for the current request from the session
 * cookie. Returns null when absent/invalid/expired — callers must treat that
 * as "unauthenticated" and respond accordingly (401 for API routes, redirect
 * for pages). */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireCurrentUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Resolves the user from an `Authorization: Bearer <token>` header — used
 * only by the /api/extension/* routes, never by session-cookie routes, so a
 * leaked personal access token can't be used to reach anything beyond that
 * narrow surface. */
export async function requireBearerUser(request: NextRequest): Promise<AuthedUser> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const user = await verifyApiToken(token);
  if (!user) throw new UnauthorizedError();
  return user;
}
