import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { updateUserSortOrder } from "@/lib/repositories/users";

const bodySchema = z.object({
  sortOrder: z.enum(["DATE_CAPTURED_DESC", "DATE_CAPTURED_ASC", "UPDATED_AT_DESC", "COMPANY_ASC"]),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());
    await updateUserSortOrder(user.id, body.sortOrder);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
