import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { addNote } from "@/lib/repositories/applications";

const bodySchema = z.object({ note: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());
    const event = await addNote(user.id, params.id, body.note);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
