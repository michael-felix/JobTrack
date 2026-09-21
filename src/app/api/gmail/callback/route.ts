import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { exchangeCodeForTokens, fetchProfileEmail } from "@/lib/gmail";
import { saveGmailConnection } from "@/lib/repositories/gmail";

const STATE_COOKIE = "gmail_oauth_state";

/** A browser-navigation OAuth callback, not a fetch() call — errors redirect
 * back to Settings with a query flag instead of returning JSON, since
 * there's no client-side caller to parse a JSON error here. */
export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.url);
  try {
    const user = await requireCurrentUser();
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const cookieState = request.cookies.get(STATE_COOKIE)?.value;

    if (!code || !state || !cookieState || state !== cookieState) {
      settingsUrl.searchParams.set("gmail", "error");
      return NextResponse.redirect(settingsUrl);
    }

    const { accessToken, refreshToken } = await exchangeCodeForTokens(code);
    const email = await fetchProfileEmail(accessToken);
    await saveGmailConnection(user.id, email, refreshToken);

    settingsUrl.searchParams.set("gmail", "connected");
    const res = NextResponse.redirect(settingsUrl);
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch {
    settingsUrl.searchParams.set("gmail", "error");
    return NextResponse.redirect(settingsUrl);
  }
}
