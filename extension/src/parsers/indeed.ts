import type { SiteParser } from "@/parsers/types";
import { firstBlockText, firstText } from "@/parsers/dom-utils";

/** Indeed job posting pages.
 *
 * Selector order matters: the `vj-*` (view-job) testids are what Indeed's
 * current React frontend actually renders — confirmed 2026-09 against a
 * live indeed.com job page — and are tried first. The older
 * `jobsearch-JobInfoHeader-*` / `inlineHeader-*` / `jobDescriptionText`
 * selectors are kept as a second attempt in case Indeed serves an older
 * template variant (they were this parser's only selectors before, and
 * turned out not to match current markup at all — see the extension
 * README's "known gap" note on fixtures never having been checked against
 * a live page). */
export const parseIndeed: SiteParser = (doc, url) => {
  const jobTitle = firstText(doc, ["[data-testid='vj-job-title']", ".jobsearch-JobInfoHeader-title", "h1"]);
  const company = firstText(doc, [
    "[data-testid='vj-company-name']",
    "[data-testid='inlineHeader-companyName']",
    "div[class*='companyName']",
  ]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, [
    "[data-testid='company-info-metadata'] div:has([data-testid='vj-company-name']) + div",
    "[data-testid='inlineHeader-companyLocation']",
  ]);
  const salary = firstText(doc, ["#salaryInfoAndJobType", "span[class*='salary']"]);
  const jobDescription = firstBlockText(doc, ["#jobDescriptionText", "[data-testid='jobDetailsSection']"]);

  return { jobTitle, company, location, salary, jobDescription, jobUrl: url };
};
