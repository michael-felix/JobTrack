import type { SiteParser } from "@/parsers/types";
import { firstText } from "@/parsers/dom-utils";

/**
 * LinkedIn job posting pages. Selectors are a best-effort approximation of
 * LinkedIn's markup (verified against hand-authored fixtures, not a live
 * page fetch) and are the most likely thing to need updating if LinkedIn
 * changes its DOM — that's why every field tries multiple selectors and the
 * parser returns null (never throws) when the essentials are missing.
 *
 * LinkedIn's current logged-in job-details pane ("SemanticJobDetails") uses
 * auto-generated, non-semantic atomic CSS class names that are useless as
 * selectors — there's no `<h1>` for the title at all there. Instead it
 * anchors on stable, semantically-named attributes: the job ID (pulled from
 * the page URL, which is either `/jobs/view/{id}` or `?currentJobId={id}`)
 * appears in the title link's `href`, and the description sits in
 * `id="JobDetails_AboutTheJob_{id}"` / `data-testid="expandable-text-box"`.
 */
export const parseLinkedIn: SiteParser = (doc, url) => {
  const jobId = url.match(/(?:jobs\/view\/|currentJobId=)(\d+)/)?.[1];

  const jobTitle = firstText(doc, [
    "h1.top-card-layout__title",
    "h1[class*='job-title']",
    "h1",
    ...(jobId ? [`a[href*='/jobs/view/${jobId}']`] : []),
    "a[href*='/jobs/view/']",
  ]);
  const company = firstText(doc, [
    ".topcard__org-name-link",
    "a[class*='org-name']",
    "span[class*='org-name']",
    ".job-details-jobs-unified-top-card__company-name",
    "a[class*='company-name']",
    "div[class*='company-name']",
    "a[href*='/company/']",
  ]);

  if (!jobTitle || !company) return null;

  const location = firstText(doc, [
    ".topcard__flavor--bullet",
    "span[class*='bullet']",
    ".job-details-jobs-unified-top-card__primary-description-container",
    "div[class*='primary-description-container']",
    // SemanticJobDetails layout: no class/id hook on the location text itself.
    // It's the first <span> in a <p> sibling of the div wrapping the title
    // link — that <p> also holds "Reposted N days ago" etc. as later spans,
    // so grab only the first child rather than the whole paragraph's text.
    ...(jobId ? [`div:has(a[href*='/jobs/view/${jobId}']) ~ p span:first-child`] : []),
    "div:has(a[href*='/jobs/view/']) ~ p span:first-child",
  ]);
  const jobDescription = firstText(doc, [
    "#job-details",
    ".description__text",
    "div[class*='description']",
    "[data-testid='expandable-text-box']",
    "[id^='JobDetails_AboutTheJob_']",
  ]);

  // Prefer a canonical /jobs/view/{id} link over the page's actual URL: the
  // search-results view's URL is a huge, session-specific string (tracking
  // params, the whole search query) that isn't a stable link back to this
  // job, while /jobs/view/{id} always is.
  const jobUrl = jobId ? `https://www.linkedin.com/jobs/view/${jobId}/` : url;

  return { jobTitle, company, location, jobDescription, jobUrl };
};
