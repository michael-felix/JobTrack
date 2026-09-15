import { SKILLS_DICTIONARY, stopwords } from "@/lib/skills-dictionary";

export interface MatchScoreResult {
  score: number; // 0-100
  missingKeywords: string[];
  missingSkills: string[];
  strengths: string[];
}

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Finds which dictionary skills appear in the given text, matching whole
 * words/phrases so "java" doesn't match inside "javascript". */
export function extractSkills(text: string, dictionary: string[] = SKILLS_DICTIONARY): string[] {
  const normalized = normalize(text);
  return dictionary.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![a-z0-9+#])${escaped}(?![a-z0-9+#])`, "i");
    return pattern.test(normalized);
  });
}

/** Extracts the most frequent meaningful (non-stopword, length > 3) words
 * from a job description as free-text keywords, independent of the curated
 * skills dictionary — catches domain terms the dictionary doesn't know about. */
export function extractKeywords(text: string, limit = 15): string[] {
  const words = normalize(text).match(/[a-z][a-z0-9+#\-]{2,}/g) ?? [];
  const stop = stopwords();
  const counts = new Map<string, number>();
  for (const word of words) {
    if (stop.has(word) || word.length <= 3) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Deterministic, local résumé-to-job-description match score. Not an LLM
 * call: it tokenizes both texts, checks which curated skills/technologies and
 * frequent job-description keywords appear in the résumé, and reports a
 * percentage plus actionable missing/matched lists.
 */
export function computeMatchScore(resumeText: string, jobDescriptionText: string): MatchScoreResult {
  const jdSkills = extractSkills(jobDescriptionText);
  const resumeSkills = new Set(extractSkills(resumeText));

  const strengths = jdSkills.filter((skill) => resumeSkills.has(skill));
  const missingSkills = jdSkills.filter((skill) => !resumeSkills.has(skill));

  // Words already covered by a skill (e.g. "machine"/"learning" inside the
  // phrase "machine learning") are excluded so the same gap isn't reported twice.
  const skillWords = new Set(jdSkills.flatMap((skill) => skill.split(" ")));
  const jdKeywords = extractKeywords(jobDescriptionText).filter((keyword) => !skillWords.has(keyword));
  const resumeNormalized = normalize(resumeText);
  const missingKeywords = jdKeywords.filter((keyword) => !resumeNormalized.includes(keyword));

  const score = jdSkills.length === 0 ? 0 : Math.round((strengths.length / jdSkills.length) * 100);

  return { score, missingKeywords, missingSkills, strengths };
}
