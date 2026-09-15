import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, SESSION_COOKIE_NAME } from "@/lib/auth";
import { errorResponse } from "@/lib/api-helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());

    // Per-account limit (stops brute-forcing one email) and a coarser
    // per-IP limit (stops one source from spraying attempts across many
    // accounts). Checked before the password is verified. The rate-limit
    // key is lowercased so "Foo@x.com" and "foo@x.com" share one bucket;
    // that's independent of (and doesn't change) the actual lookup below,
    // which — matching signup — uses the email exactly as given.
    const perAccount = rateLimit(`login:email:${body.email.toLowerCase()}`, 8, 10 * 60 * 1000);
    const perIp = rateLimit(`login:ip:${clientIp(request)}`, 30, 10 * 60 * 1000);
    if (!perAccount.allowed || !perIp.allowed) {
      const retryAfterMs = Math.max(perAccount.retryAfterMs, perIp.retryAfterMs);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    const { token, expiresAt, rememberMe } = await login(body.email, body.password, body.rememberMe);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Omitting `expires` for a not-remembered login makes it a session
      // cookie that the browser clears on close, matching the server-side
      // session's shorter TTL instead of outliving it in the browser.
      ...(rememberMe ? { expires: expiresAt } : {}),
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
