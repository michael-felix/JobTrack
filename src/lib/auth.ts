import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "jobtrack_session";
const REMEMBERED_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, "stay signed in"
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day when not "staying signed in"

export interface AuthedUser {
  id: string;
  email: string;
  name: string | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signup(email: string, password: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  return createSession(user.id, true);
}

// A precomputed bcrypt(12) hash with no known plaintext, used only to burn
// the same CPU time as a real password check when the account doesn't
// exist — see the comment in login() below for why this matters.
const DUMMY_PASSWORD_HASH = "$2a$12$cfCQmgkBCDZ3gUX2jVILZ.RAycsMSVetd3loF7PS0cHDCQnMULvbi";

export async function login(email: string, password: string, rememberMe: boolean) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always run bcrypt.compare, even for a nonexistent account, against a
  // hash of the same cost factor. Returning early for "no such user" would
  // make that response consistently faster than a real wrong-password
  // attempt (which pays bcrypt's ~100-300ms cost) — an identical error
  // message doesn't hide that timing difference, so it'd still let an
  // attacker enumerate registered emails by measuring response time.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !valid) {
    throw new Error("Invalid email or password.");
  }
  return createSession(user.id, rememberMe);
}

/** Issues a fresh opaque session token; only its SHA-256 hash is persisted, so a
 * database leak never yields usable session tokens. `rememberMe` controls both
 * how long the server-side session record is valid for and (in the route
 * handlers) whether the cookie itself persists past the browser closing. */
export async function createSession(
  userId: string,
  rememberMe: boolean
): Promise<{ token: string; expiresAt: Date; rememberMe: boolean }> {
  const token = randomBytes(32).toString("hex");
  const ttl = rememberMe ? REMEMBERED_SESSION_TTL_MS : DEFAULT_SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt, rememberMe };
}

export async function verifySession(token: string | undefined | null): Promise<AuthedUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export async function revokeSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}
