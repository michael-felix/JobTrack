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
});
