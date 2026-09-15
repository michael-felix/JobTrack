import { describe, expect, it, vi } from "vitest";
import { extractText, UnsupportedFileTypeError } from "@/lib/resume-parser";

vi.mock("pdf-parse", () => ({
  default: vi.fn(async (buffer: Buffer) => ({ text: `PDF:${buffer.toString("utf-8")}` })),
}));

vi.mock("mammoth", () => ({
  extractRawText: vi.fn(async ({ buffer }: { buffer: Buffer }) => ({ value: `DOCX:${buffer.toString("utf-8")}` })),
}));

describe("extractText", () => {
  it("extracts plain text from a .txt file as-is", async () => {
    const text = await extractText(Buffer.from("Hello résumé\r\nSecond line   \n"), "resume.txt");
    expect(text).toBe("Hello résumé\nSecond line");
  });

  it("delegates .pdf files to pdf-parse", async () => {
    const text = await extractText(Buffer.from("raw-pdf-bytes"), "resume.pdf");
    expect(text).toBe("PDF:raw-pdf-bytes");
  });

  it("delegates .docx files to mammoth", async () => {
    const text = await extractText(Buffer.from("raw-docx-bytes"), "resume.docx");
    expect(text).toBe("DOCX:raw-docx-bytes");
  });

  it("throws UnsupportedFileTypeError for unrecognized extensions, enabling a manual-entry fallback", async () => {
    await expect(extractText(Buffer.from("data"), "resume.pages")).rejects.toBeInstanceOf(
      UnsupportedFileTypeError
    );
  });
});
