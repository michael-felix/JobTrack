import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import path from "path";
import { parseIndeed } from "@/parsers/indeed";

function loadFixture(name: string): Document {
  const html = readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
  return new JSDOM(html).window.document;
}

describe("parseIndeed", () => {
  it("extracts structured fields from a well-formed posting", () => {
    const doc = loadFixture("indeed-well-formed.html");
    const result = parseIndeed(doc, "https://www.indeed.com/viewjob?jk=12345");

    expect(result).toEqual({
      jobTitle: "Frontend Developer",
      company: "Initech",
      location: "Brisbane QLD",
      salary: "$90,000 - $110,000 a year",
      jobDescription: "Looking for a Frontend Developer skilled in React and TypeScript.",
      jobUrl: "https://www.indeed.com/viewjob?jk=12345",
    });
  });

  it("returns null instead of throwing when the page structure has changed", () => {
    const doc = loadFixture("indeed-mangled.html");
    expect(parseIndeed(doc, "https://www.indeed.com/viewjob?jk=12345")).toBeNull();
  });

  it("extracts fields from Indeed's current live React frontend structure", () => {
    // Reproduces real indeed.com markup (data-testid names/nesting) as of
    // 2026-09 — this is the actual bug: the selectors above never matched
    // this structure at all, only the older hand-authored fixture.
    const doc = loadFixture("indeed-2026-live-structure.html");
    const result = parseIndeed(doc, "https://www.indeed.com/viewjob?jk=03616222f7fd152f");

    expect(result).toEqual({
      jobTitle: "Junior Software Engineer",
      company: "Tarpon Health",
      location: "Remote",
      salary: undefined,
      jobDescription: "Job details\n\nLooking for a Junior Software Engineer skilled in TypeScript and React.",
      jobUrl: "https://www.indeed.com/viewjob?jk=03616222f7fd152f",
    });
  });
});
