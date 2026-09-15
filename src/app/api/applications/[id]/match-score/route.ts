import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { getApplicationOwnedByUser, getLatestMatchScore, saveMatchScore } from "@/lib/repositories/matchScores";
import { getDocumentVersion } from "@/lib/repositories/documents";
import { computeMatchScore } from "@/lib/match-score";

const bodySchema = z.object({ documentVersionId: z.string().min(1) });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const matchScore = await getLatestMatchScore(user.id, params.id);
    return NextResponse.json({ matchScore });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());

    const application = await getApplicationOwnedByUser(user.id, params.id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!application.jobDescription) {
      return NextResponse.json(
        { error: "This application has no job description to score against." },
        { status: 400 }
      );
    }

    const document = await getDocumentVersion(user.id, body.documentVersionId);
    if (!document) {
      return NextResponse.json({ error: "Document version not found" }, { status: 404 });
    }

    const result = computeMatchScore(document.extractedText, application.jobDescription);
    const matchScore = await saveMatchScore(user.id, params.id, document.id, result);
    return NextResponse.json({ matchScore }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
