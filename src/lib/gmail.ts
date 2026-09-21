import { AppError } from "@/lib/errors";

/**
 * Thin wrapper over Google's OAuth2 + Gmail REST APIs — deliberately plain
 * `fetch` calls rather than the `googleapis` package, since this only needs
 * three endpoints (token exchange/refresh, profile, message search).
 *
 * Scope is `gmail.readonly`, a Google "restricted" scope: getting it
 * verified for public use requires a CASA security assessment, which isn't
 * proportionate for a personal app. Instead the OAuth client stays in
 * Google's "Testing" publish status with the user's own account added as a
 * test user — fully functional, but shows an "unverified app" warning
 * during consent. See docs/ARCHITECTURE.md.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError("Gmail integration isn't configured.");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = config();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { clientId, clientSecret, redirectUri } = config();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new AppError("Failed to connect Gmail — the authorization code was rejected.");
  }
  const data = await res.json();
  if (!data.refresh_token) {
    throw new AppError(
      "Google didn't return a refresh token. Remove JobTrack's access at myaccount.google.com/permissions and try connecting again."
    );
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = config();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new AppError("Gmail access has expired or been revoked — reconnect it from Settings.");
  }
  const data = await res.json();
  return data.access_token;
}

export async function fetchProfileEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${GMAIL_API}/profile`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new AppError("Failed to read the Gmail profile.");
  }
  const data = await res.json();
  return data.emailAddress;
}

export interface GmailMessageSummary {
  id: string;
  subject: string;
  from: string;
  snippet: string;
}

// Deliberately broad rather than clever — false positives are cheap here
// (the caller only ever suggests, never applies, a stage change), while a
// missed rejection is the failure mode that actually defeats the feature.
const REJECTION_QUERY =
  'newer_than:45d (reject OR "not moving forward" OR "unable to offer" OR "other candidates" OR "not selected" OR "decided to proceed with other" OR "pursue other candidates")';

export async function searchRejectionEmails(refreshToken: string): Promise<GmailMessageSummary[]> {
  const accessToken = await getAccessToken(refreshToken);

  const listRes = await fetch(`${GMAIL_API}/messages?maxResults=25&q=${encodeURIComponent(REJECTION_QUERY)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    throw new AppError("Failed to search Gmail.");
  }
  const listData = await listRes.json();
  const ids: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id);

  const messages = await Promise.all(
    ids.map(async (id): Promise<GmailMessageSummary | null> => {
      const res = await fetch(
        `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const headers: { name: string; value: string }[] = data.payload?.headers ?? [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      return { id, subject, from, snippet: data.snippet ?? "" };
    })
  );
  return messages.filter((m): m is GmailMessageSummary => m !== null);
}
