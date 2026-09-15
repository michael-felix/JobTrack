import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { transitionStage } from "@/lib/repositories/applications";

const bodySchema = z.object({
  toStage: z.enum(["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"]),
  note: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());
    const application = await transitionStage(user.id, id, body.toStage, body.note);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    return errorResponse(error);
  }
}
