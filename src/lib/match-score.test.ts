import { describe, expect, it } from "vitest";
import { computeMatchScore, extractKeywords, extractSkills } from "@/lib/match-score";

describe("extractSkills", () => {
  it("matches whole-word skills case-insensitively", () => {
    const text = "We use React, TypeScript, and PostgreSQL daily.";
    const skills = extractSkills(text, ["react", "typescript", "postgresql", "vue"]);
    expect(skills).toEqual(["react", "typescript", "postgresql"]);
  });

  it("does not match a skill as a substring of another word", () => {
    // "java" must not match inside "javascript"
    const text = "Experience with JavaScript required.";
    const skills = extractSkills(text, ["java", "javascript"]);
    expect(skills).toEqual(["javascript"]);
  });

  it("matches multi-word phrases", () => {
    const text = "Strong background in machine learning and data analysis.";
    const skills = extractSkills(text, ["machine learning", "data analysis"]);
    expect(skills).toEqual(["machine learning", "data analysis"]);
  });
});

describe("extractKeywords", () => {
  it("ranks frequent non-stopword terms and excludes short/stopwords", () => {
    const text = "Kubernetes Kubernetes Kubernetes deployment deployment the and for team";
    const keywords = extractKeywords(text, 5);
    expect(keywords[0]).toBe("kubernetes");
    expect(keywords).not.toContain("the");
    expect(keywords).not.toContain("and");
  });
});

describe("computeMatchScore", () => {
  const jobDescription = `
    We're looking for an engineer with strong experience in Python, AWS,
    Docker, and Kubernetes. Familiarity with machine learning is a plus.
  `;

  it("scores 100 when every JD skill appears in the résumé", () => {
    const resume =
      "Built services in Python deployed on AWS using Docker and Kubernetes, with some machine learning experience.";
    const result = computeMatchScore(resume, jobDescription);
    expect(result.score).toBe(100);
    expect(result.missingSkills).toEqual([]);
    expect(result.strengths).toEqual(
      expect.arrayContaining(["python", "aws", "docker", "kubernetes", "machine learning"])
    );
  });

  it("reports missing skills and a partial score when some are absent", () => {
    const resume = "Built services in Python deployed on AWS.";
    const result = computeMatchScore(resume, jobDescription);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.missingSkills).toEqual(expect.arrayContaining(["docker", "kubernetes"]));
    expect(result.strengths).toEqual(expect.arrayContaining(["python", "aws"]));
  });

  it("scores 0 and reports no strengths when nothing overlaps", () => {
    const resume = "Experienced watercolor painter and part-time barista.";
    const result = computeMatchScore(resume, jobDescription);
    expect(result.score).toBe(0);
    expect(result.strengths).toEqual([]);
  });

  it("returns score 0 when the job description has no recognized skills", () => {
    const result = computeMatchScore("Python developer.", "We need a great team player.");
    expect(result.score).toBe(0);
    expect(result.missingSkills).toEqual([]);
  });
});
