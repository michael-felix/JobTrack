import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import path from "path";
import { parseJobPosting } from "@/parsers/index";

function loadFixture(name: string): Document {
  const html = readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
  return new JSDOM(html).window.document;
}

describe("parseJobPosting", () => {
  it("dispatches linkedin.com to the LinkedIn parser", () => {
    const doc = loadFixture("linkedin-well-formed.html");
    const result = parseJobPosting(doc, "https://www.linkedin.com/jobs/view/1");
    expect(result?.company).toBe("Acme Corp");
  });

  it("dispatches seek.com.au to the Seek parser", () => {
    const doc = loadFixture("seek-well-formed.html");
    const result = parseJobPosting(doc, "https://www.seek.com.au/job/1");
    expect(result?.company).toBe("Globex Pty Ltd");
  });

  it("dispatches indeed.com to the Indeed parser", () => {
    const doc = loadFixture("indeed-well-formed.html");
    const result = parseJobPosting(doc, "https://www.indeed.com/viewjob?jk=1");
    expect(result?.company).toBe("Initech");
  });

  it("returns null for an unsupported site instead of throwing", () => {
    const doc = loadFixture("linkedin-well-formed.html");
    expect(parseJobPosting(doc, "https://example.com/some-job")).toBeNull();
  });
});
