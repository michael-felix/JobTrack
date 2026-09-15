import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signup, SESSION_COOKIE_NAME } from "@/lib/auth";
import { errorResponse } from "@/lib/api-helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const perIp = rateLimit(`signup:ip:${clientIp(request)}`, 5, 60 * 60 * 1000);
    if (!perIp.allowed) {
      return NextResponse.json(
        { error: "Too many accounts created from this network. Please try again later." },
        { status: 429, headers: { "Retry-After": Math.ceil(perIp.retryAfterMs / 1000).toString() } }
      );
    }

    const body = bodySchema.parse(await request.json());
    const { token, expiresAt } = await signup(body.email, body.password, body.name);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
