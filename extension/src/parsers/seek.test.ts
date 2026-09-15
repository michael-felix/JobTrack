import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import path from "path";
import { parseSeek } from "@/parsers/seek";

function loadFixture(name: string): Document {
  const html = readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
  return new JSDOM(html).window.document;
}

describe("parseSeek", () => {
  it("extracts structured fields from a well-formed posting", () => {
    const doc = loadFixture("seek-well-formed.html");
    const result = parseSeek(doc, "https://www.seek.com.au/job/12345");

    expect(result).toEqual({
      jobTitle: "Data Engineer",
      company: "Globex Pty Ltd",
      location: "Melbourne VIC",
      salary: "$120,000 - $140,000",
      jobDescription: "We need a Data Engineer experienced with Airflow, Spark, and Kubernetes.",
      jobUrl: "https://www.seek.com.au/job/12345",
    });
  });

  it("returns null instead of throwing when the page structure has changed", () => {
    const doc = loadFixture("seek-mangled.html");
    expect(parseSeek(doc, "https://www.seek.com.au/job/12345")).toBeNull();
  });
});
