import path from "path";

export class UnsupportedFileTypeError extends Error {
  constructor(ext: string) {
    super(`Unsupported file type "${ext}". Upload a PDF, DOCX, or TXT file.`);
    this.name = "UnsupportedFileTypeError";
  }
}

/** Extracts plain text from an uploaded résumé/cover-letter file so it can be
 * diffed and scored. Supports PDF, DOCX, and plain text; anything else throws
 * UnsupportedFileTypeError so callers can show a graceful error instead of
 * silently storing an empty/garbled document. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return normalize(result.text);
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return normalize(result.value);
  }

  if (ext === ".txt") {
    return normalize(buffer.toString("utf-8"));
  }

  throw new UnsupportedFileTypeError(ext);
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}
