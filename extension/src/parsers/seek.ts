import type { SiteParser } from "@/parsers/types";
import { firstText } from "@/parsers/dom-utils";

/**
 * Seek job posting pages. Seek marks up most fields with stable
 * `data-automation` attributes, which tend to survive visual redesigns
 * better than class names — so those are tried first, with a class-based
 * fallback.
 */
export const parseSeek: SiteParser = (doc, url) => {
  const jobTitle = firstText(doc, ["[data-automation='job-detail-title']", "h1"]);
  const company = firstText(doc, ["[data-automation='advertiser-name']"]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, ["[data-automation='job-detail-location']"]);
  const salary = firstText(doc, ["[data-automation='job-detail-salary']"]);
  const jobDescription = firstText(doc, ["[data-automation='jobAdDetails']"]);

  return { jobTitle, company, location, salary, jobDescription, jobUrl: url };
};
