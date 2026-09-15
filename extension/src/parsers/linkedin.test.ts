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

  it("extracts structured fields from the logged-in unified-top-card layout", () => {
    const doc = loadFixture("linkedin-unified-top-card.html");
    const result = parseLinkedIn(doc, "https://www.linkedin.com/jobs/search-results/?currentJobId=4454987436");

    expect(result).toEqual({
      jobTitle: "Senior Backend Engineer",
      company: "Acme Corp",
      location: "Sydney, Australia",
      jobDescription: "We are looking for a Senior Backend Engineer with strong Python and AWS experience.",
      jobUrl: "https://www.linkedin.com/jobs/search-results/?currentJobId=4454987436",
    });
  });

  it("extracts title/company/description from the current SemanticJobDetails layout (atomic/hashed classes, no h1)", () => {
    // Location has no stable, non-hashed hook on this layout (no href/id/data-testid
    // like the other fields get) so it's not reliably extractable here; it's an
    // optional field, so this doesn't block the capture the way a missing
    // jobTitle/company would.
    const doc = loadFixture("linkedin-semantic-job-details.html");
    const result = parseLinkedIn(doc, "https://www.linkedin.com/jobs/search-results/?currentJobId=4454987436");

    expect(result).toEqual({
      jobTitle: "Senior Backend Engineer",
      company: "Acme Corp",
      location: undefined,
      jobDescription: "We are looking for a Senior Backend Engineer with strong Python and AWS experience.",
      jobUrl: "https://www.linkedin.com/jobs/search-results/?currentJobId=4454987436",
    });
  });

  it("returns null instead of throwing when the page structure has changed", () => {
    const doc = loadFixture("linkedin-mangled.html");
    expect(parseLinkedIn(doc, "https://www.linkedin.com/jobs/view/12345")).toBeNull();
  });
});
