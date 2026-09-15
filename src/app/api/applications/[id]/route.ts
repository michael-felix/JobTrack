import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { deleteApplication, getApplication, updateApplication } from "@/lib/repositories/applications";

const updateSchema = z.object({
  jobTitle: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().optional(),
  jobDescription: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional().nullable(),
  resumeVersionId: z.string().optional().nullable(),
  coverLetterVersionId: z.string().optional().nullable(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const application = await getApplication(user.id, params.id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const body = updateSchema.parse(await request.json());
    const application = await updateApplication(user.id, params.id, {
      ...body,
      followUpDate: body.followUpDate === undefined ? undefined : body.followUpDate ? new Date(body.followUpDate) : null,
    });
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const deleted = await deleteApplication(user.id, params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
