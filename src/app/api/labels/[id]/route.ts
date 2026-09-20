import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { deleteLabel, updateLabel } from "@/lib/repositories/labels";

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #BD5B36.")
    .optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = updateSchema.parse(await request.json());
    const label = await updateLabel(user.id, id, body);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ label });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const deleted = await deleteLabel(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
