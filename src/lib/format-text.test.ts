import { describe, expect, it } from "vitest";
import { cleanMultilineText } from "@/lib/format-text";

describe("cleanMultilineText", () => {
  it("trims trailing whitespace on each line", () => {
    expect(cleanMultilineText("Line one   \nLine two\t")).toBe("Line one\nLine two");
  });

  it("collapses runs of 3+ blank lines to one blank line", () => {
    expect(cleanMultilineText("A\n\n\n\n\nB")).toBe("A\n\nB");
  });

  it("preserves a single intentional blank line between paragraphs", () => {
    expect(cleanMultilineText("A\n\nB")).toBe("A\n\nB");
  });

  it("normalizes CRLF line endings", () => {
    expect(cleanMultilineText("A\r\nB")).toBe("A\nB");
  });

  it("trims leading and trailing whitespace overall", () => {
    expect(cleanMultilineText("\n\n  Hello  \n\n")).toBe("Hello");
  });
});
