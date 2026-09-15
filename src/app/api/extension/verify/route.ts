import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";

/** Lets the extension's options page confirm a token + backend URL are
 * correctly configured, without exposing anything beyond the account email. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBearerUser(request);
    return NextResponse.json({ email: user.email });
  } catch (error) {
    return errorResponse(error);
  }
}
