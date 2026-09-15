import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import path from "path";
import { parseLinkedIn } from "@/parsers/linkedin";

function loadFixture(name: string): Document {
  const html = readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
  return new JSDOM(html).window.document;
}

describe("parseLinkedIn", () => {
  it("extracts structured fields from a well-formed posting", () => {
    const doc = loadFixture("linkedin-well-formed.html");
    const result = parseLinkedIn(doc, "https://www.linkedin.com/jobs/view/12345");

    expect(result).toEqual({
      jobTitle: "Senior Backend Engineer",
      company: "Acme Corp",
      location: "Sydney, Australia",
      jobDescription: "We are looking for a Senior Backend Engineer with strong Python and AWS experience.",
      jobUrl: "https://www.linkedin.com/jobs/view/12345",
    });
  });

  it("returns null instead of throwing when the page structure has changed", () => {
    const doc = loadFixture("linkedin-mangled.html");
    expect(parseLinkedIn(doc, "https://www.linkedin.com/jobs/view/12345")).toBeNull();
  });
});
