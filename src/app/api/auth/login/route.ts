import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, SESSION_COOKIE_NAME } from "@/lib/auth";
import { errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const { token, expiresAt } = await login(body.email, body.password);

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
