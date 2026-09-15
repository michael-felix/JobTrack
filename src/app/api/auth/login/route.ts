import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, SESSION_COOKIE_NAME } from "@/lib/auth";
import { errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
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
