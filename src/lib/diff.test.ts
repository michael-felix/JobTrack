import { describe, expect, it } from "vitest";
import { diffVersions } from "@/lib/diff";

describe("diffVersions", () => {
  it("returns a single unchanged part for identical text", () => {
    const parts = diffVersions("Same text here", "Same text here");
    expect(parts.every((p) => p.type === "unchanged")).toBe(true);
  });

  it("flags additions and removals between versions", () => {
    const parts = diffVersions("Experienced with Python and Django.", "Experienced with Python, AWS, and Django.");
    expect(parts.some((p) => p.type === "added" && p.value.includes("AWS"))).toBe(true);
  });

  it("handles fully replaced text", () => {
    const parts = diffVersions("Old résumé content", "Brand new résumé content");
    expect(parts.some((p) => p.type === "removed")).toBe(true);
    expect(parts.some((p) => p.type === "added")).toBe(true);
  });
});
