import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { getDocumentVersion } from "@/lib/repositories/documents";
import { diffVersions } from "@/lib/diff";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const fromId = request.nextUrl.searchParams.get("from");
    const toId = request.nextUrl.searchParams.get("to");
    if (!fromId || !toId) {
      return NextResponse.json({ error: "Both from and to document ids are required." }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      getDocumentVersion(user.id, fromId),
      getDocumentVersion(user.id, toId),
    ]);
    if (!from || !to) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parts = diffVersions(from.extractedText, to.extractedText);
    return NextResponse.json({ parts });
  } catch (error) {
    return errorResponse(error);
  }
}
