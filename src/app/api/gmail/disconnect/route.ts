import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { deleteGmailConnection } from "@/lib/repositories/gmail";

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    await deleteGmailConnection(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
