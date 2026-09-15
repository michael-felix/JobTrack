import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBearerUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { createApplication } from "@/lib/repositories/applications";

/**
 * The only endpoint a Chrome-extension personal access token can reach that
 * mutates data — and it can only ever create a new SAVED application, never
 * read, update, or delete anything else. See requireBearerUser in
 * src/lib/current-user.ts and docs/ARCHITECTURE.md.
 */
const bodySchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireBearerUser(request);
    const body = bodySchema.parse(await request.json());
    const application = await createApplication(user.id, body);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
