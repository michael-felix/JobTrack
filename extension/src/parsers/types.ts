export interface ParsedJob {
  jobTitle: string;
  company: string;
  location?: string;
  salary?: string;
  jobDescription?: string;
  jobUrl: string;
}

/** null means "couldn't confidently parse this page" — callers must fall
 * back to a blank, manually-editable form rather than failing silently. */
export type ParseResult = ParsedJob | null;

export type SiteParser = (doc: Document, url: string) => ParseResult;
