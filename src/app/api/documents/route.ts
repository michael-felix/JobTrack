import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { createDocumentVersion, listDocumentVersions } from "@/lib/repositories/documents";
import { extractText, UnsupportedFileTypeError } from "@/lib/resume-parser";
import { storage } from "@/lib/storage";
import type { DocumentType } from "@prisma/client";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const typeParam = request.nextUrl.searchParams.get("type") as DocumentType | null;
    const documents = await listDocumentVersions(user.id, typeParam ?? undefined);
    return NextResponse.json({ documents });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const formData = await request.formData();

    const file = formData.get("file");
    const manualText = formData.get("text");
    const type = formData.get("type");
    const label = formData.get("label");
    const changeSummary = formData.get("changeSummary");

    if (!(file instanceof File) && typeof manualText !== "string") {
      return NextResponse.json({ error: "A file or pasted text is required." }, { status: 400 });
    }
    if (type !== "RESUME" && type !== "COVER_LETTER") {
      return NextResponse.json({ error: "type must be RESUME or COVER_LETTER." }, { status: 400 });
    }
    if (typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json({ error: "A version label is required." }, { status: 400 });
    }

    let extractedText: string;
    let fileName: string;
    let storagePath: string;

    if (file instanceof File) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File exceeds the 10MB limit." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        extractedText = await extractText(buffer, file.name);
      } catch (error) {
        if (error instanceof UnsupportedFileTypeError) {
          // Graceful fallback: tell the client to re-submit as pasted text
          // instead of silently discarding the upload or failing hard.
          return NextResponse.json({ error: error.message, fallback: "manual-entry" }, { status: 422 });
        }
        throw error;
      }
      storagePath = await storage.put(buffer, file.name);
      fileName = file.name;
    } else {
      extractedText = (manualText as string).trim();
      fileName = `${label}.txt`;
      storagePath = await storage.put(Buffer.from(extractedText, "utf-8"), fileName);
    }

    const document = await createDocumentVersion(user.id, {
      type,
      label,
      fileName,
      storagePath,
      extractedText,
      changeSummary: typeof changeSummary === "string" ? changeSummary : undefined,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
