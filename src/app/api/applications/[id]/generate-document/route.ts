import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { AppError } from "@/lib/errors";
import { getApplication } from "@/lib/repositories/applications";
import { getDocumentVersion } from "@/lib/repositories/documents";
import { generateTailoredDocument } from "@/lib/document-generation";

const bodySchema = z.object({
  type: z.enum(["RESUME", "COVER_LETTER"]),
  baseDocumentVersionId: z.string(),
});

/** Generates a tailored draft only — it never writes a DocumentVersion.
 * The client shows the draft for review and, if the user chooses, saves it
 * through the existing POST /api/documents pasted-text path, same as any
 * manually entered version. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const { type, baseDocumentVersionId } = bodySchema.parse(await request.json());

    const application = await getApplication(user.id, id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!application.jobDescription) {
      throw new AppError("Add a job description to this application first.");
    }

    const baseDocument = await getDocumentVersion(user.id, baseDocumentVersionId);
    if (!baseDocument) {
      throw new AppError("Base document not found.");
    }

    const text = await generateTailoredDocument({
      type,
      jobTitle: application.jobTitle,
      company: application.company,
      jobDescription: application.jobDescription,
      baseDocumentText: baseDocument.extractedText,
    });

    return NextResponse.json({ text });
  } catch (error) {
    return errorResponse(error);
  }
}
