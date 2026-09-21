import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { buildAuthUrl } from "@/lib/gmail";

const STATE_COOKIE = "gmail_oauth_state";

export async function GET() {
  try {
    await requireCurrentUser();
    const state = randomBytes(16).toString("hex");
    const res = NextResponse.redirect(buildAuthUrl(state));
    // Short-lived CSRF guard checked in the callback — not a session
    // credential, so it doesn't need the encryption crypto.ts provides.
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
