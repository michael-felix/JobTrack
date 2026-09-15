import type { SiteParser } from "@/parsers/types";
import { firstText } from "@/parsers/dom-utils";

/** Indeed job posting pages. */
export const parseIndeed: SiteParser = (doc, url) => {
  const jobTitle = firstText(doc, [".jobsearch-JobInfoHeader-title", "h1"]);
  const company = firstText(doc, ["[data-testid='inlineHeader-companyName']", "div[class*='companyName']"]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, ["[data-testid='inlineHeader-companyLocation']"]);
  const salary = firstText(doc, ["#salaryInfoAndJobType", "span[class*='salary']"]);
  const jobDescription = firstText(doc, ["#jobDescriptionText"]);

  return { jobTitle, company, location, salary, jobDescription, jobUrl: url };
};
