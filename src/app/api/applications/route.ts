import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { createApplication, listApplications } from "@/lib/repositories/applications";

const createSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  jobDescription: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const applications = await listApplications(user.id);
    return NextResponse.json({ applications });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = createSchema.parse(await request.json());
    const application = await createApplication(user.id, {
      ...body,
      jobUrl: body.jobUrl || undefined,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
