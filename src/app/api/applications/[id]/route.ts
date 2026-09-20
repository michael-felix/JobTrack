import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { deleteApplication, getApplication, updateApplication } from "@/lib/repositories/applications";
import { assertLabelsOwnedByUser } from "@/lib/repositories/labels";

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
  pinned: z.boolean().optional(),
  labelIds: z.array(z.string()).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const application = await getApplication(user.id, id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = updateSchema.parse(await request.json());
    if (body.labelIds) {
      await assertLabelsOwnedByUser(user.id, body.labelIds);
    }
    const application = await updateApplication(user.id, id, {
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const deleted = await deleteApplication(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
