import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { getInterviewPrep, upsertInterviewPrep } from "@/lib/repositories/interviewPrep";

const bodySchema = z.object({
  companyResearch: z.string().optional(),
  technicalQuestions: z.array(z.unknown()).optional(),
  behavioralQuestions: z.array(z.unknown()).optional(),
  checklist: z.array(z.unknown()).optional(),
  notes: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const prep = await getInterviewPrep(user.id, id);
    return NextResponse.json({ prep });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());
    const prep = await upsertInterviewPrep(user.id, id, body);
    if (!prep) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ prep });
  } catch (error) {
    return errorResponse(error);
  }
}
