import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { createApiToken, listApiTokens } from "@/lib/api-token-auth";

const createSchema = z.object({ label: z.string().min(1).max(60) });

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const tokens = await listApiTokens(user.id);
    return NextResponse.json({ tokens });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = createSchema.parse(await request.json());
    const { token, id } = await createApiToken(user.id, body.label);
    // The plaintext token is only ever returned here, at creation time — it
    // cannot be retrieved again afterwards (only its hash is stored).
    return NextResponse.json({ token, id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
