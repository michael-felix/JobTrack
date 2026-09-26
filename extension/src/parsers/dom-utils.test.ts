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

  it("skips embedded <style> and <script> tags instead of dumping their text content", () => {
    // Indeed embeds a literal <style>@layer htmlContent {...}</style> block
    // directly inside the job description container; a style/script
    // element's content is just a text node in the DOM, so without an
    // explicit skip it gets walked and appended like any other text.
    const doc = docFrom(
      "<div id='x'><style>.foo { color: red; }</style><script>doStuff();</script><p>Real description text.</p></div>"
    );
    expect(firstBlockText(doc, ["#x"])).toBe("Real description text.");
  });
});
