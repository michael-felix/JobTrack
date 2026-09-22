import type { SiteParser } from "@/parsers/types";
import { firstBlockText, firstText } from "@/parsers/dom-utils";

/** Indeed job posting pages.
 *
 * Selector order matters here, and this parser has already been wrong
 * twice (see extension/README.md's "known gap" note) — each fix was
 * verified against one real Indeed render but not others, since Indeed
 * serves visibly different markup for the same "view job" panel depending
 * on context (a standalone /viewjob page vs. the panel embedded in search
 * results vs. embedded on the homepage). This revision was checked against
 * a real homepage-embedded render (2026-09), which turned out to have NO
 * `vj-company-name` testid at all — company name there is just plain text
 * inside a link to `/cmp/{company}`, which is Indeed's stable company
 * profile URL prefix, so that's what this now keys off. Likewise the real
 * job description text lives right after the `vj-job-description-heading`
 * heading, not inside `jobDetailsSection` (which only holds Pay/Job-type
 * chips, not prose) as an earlier revision assumed. */
export const parseIndeed: SiteParser = (doc, url) => {
  const jobTitle = firstText(doc, [
    "[data-testid='vj-job-title']",
    "[data-testid='vj-job-title-compact']",
    ".jobsearch-JobInfoHeader-title",
    "h1",
  ]);
  const company = firstText(doc, [
    "[data-testid='company-info-metadata'] a[href*='/cmp/']",
    "[data-testid='vj-company-name']",
    "[data-testid='inlineHeader-companyName']",
    "div[class*='companyName']",
  ]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, [
    "[data-testid='company-info-metadata'] div:has(a[href*='/cmp/']) + div > div:first-child",
    "[data-testid='company-info-metadata'] div:has([data-testid='vj-company-name']) + div",
    "[data-testid='inlineHeader-companyLocation']",
  ]);
  const salary = firstText(doc, ["#salaryInfoAndJobType", "span[class*='salary']"]);
  const jobDescription = firstBlockText(doc, [
    "[data-testid='vj-job-description-heading'] + div",
    "#jobDescriptionText",
    "[data-testid='jobDetailsSection']",
  ]);

  return { jobTitle, company, location, salary, jobDescription, jobUrl: url };
};
