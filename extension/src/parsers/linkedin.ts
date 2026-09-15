import type { SiteParser } from "@/parsers/types";
import { firstText } from "@/parsers/dom-utils";

/**
 * LinkedIn job posting pages. Selectors are a best-effort approximation of
 * LinkedIn's markup (verified against hand-authored fixtures, not a live
 * page fetch) and are the most likely thing to need updating if LinkedIn
 * changes its DOM — that's why every field tries multiple selectors and the
 * parser returns null (never throws) when the essentials are missing.
 */
export const parseLinkedIn: SiteParser = (doc, url) => {
  const jobTitle = firstText(doc, [
    "h1.top-card-layout__title",
    "h1[class*='job-title']",
    "h1",
  ]);
  const company = firstText(doc, [
    ".topcard__org-name-link",
    "a[class*='org-name']",
    "span[class*='org-name']",
  ]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, [".topcard__flavor--bullet", "span[class*='bullet']"]);
  const jobDescription = firstText(doc, ["#job-details", ".description__text", "div[class*='description']"]);

  return { jobTitle, company, location, jobDescription, jobUrl: url };
};
