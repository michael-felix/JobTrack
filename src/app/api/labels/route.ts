import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { createLabel, listLabels } from "@/lib/repositories/labels";

const createSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #BD5B36."),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const labels = await listLabels(user.id);
    return NextResponse.json({ labels });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = createSchema.parse(await request.json());
    const label = await createLabel(user.id, body.name, body.color);
    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
