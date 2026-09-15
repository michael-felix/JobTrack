import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { firstBlockText, firstText } from "@/parsers/dom-utils";

function docFrom(html: string): Document {
  return new JSDOM(html).window.document;
}

describe("firstText", () => {
  it("collapses all whitespace, including newlines, to single spaces", () => {
    const doc = docFrom("<div id='x'>Line one\n\nLine two</div>");
    expect(firstText(doc, ["#x"])).toBe("Line one Line two");
  });
});

describe("firstBlockText", () => {
  it("inserts a newline between paragraphs instead of flattening them", () => {
    const doc = docFrom("<div id='x'><p>First paragraph.</p><p>Second paragraph.</p></div>");
    expect(firstBlockText(doc, ["#x"])).toBe("First paragraph.\nSecond paragraph.");
  });

  it("treats <br> as a line break", () => {
    const doc = docFrom("<div id='x'>Line one<br>Line two</div>");
    expect(firstBlockText(doc, ["#x"])).toBe("Line one\nLine two");
  });

  it("preserves list items as separate lines", () => {
    const doc = docFrom("<div id='x'><ul><li>Python</li><li>AWS</li></ul></div>");
    expect(firstBlockText(doc, ["#x"])).toBe("Python\nAWS");
  });

  it("collapses runs of 3+ blank lines down to one blank line", () => {
    const doc = docFrom("<div id='x'><p>A</p><br><br><br><p>B</p></div>");
    expect(firstBlockText(doc, ["#x"])).toBe("A\n\nB");
  });
});
