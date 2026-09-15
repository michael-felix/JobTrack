import type { ParseResult } from "@/parsers/types";
import { parseLinkedIn } from "@/parsers/linkedin";
import { parseSeek } from "@/parsers/seek";
import { parseIndeed } from "@/parsers/indeed";

/** Dispatches to the matching site parser by hostname. Returns null for an
 * unsupported site or a page the matching parser couldn't confidently read
 * — either way, the caller shows a blank manual-entry form instead of
 * failing. */
export function parseJobPosting(doc: Document, url: string): ParseResult {
  const hostname = new URL(url).hostname;

  if (hostname.includes("linkedin.com")) return parseLinkedIn(doc, url);
  if (hostname.includes("seek.com")) return parseSeek(doc, url);
  if (hostname.includes("indeed.com")) return parseIndeed(doc, url);

  return null;
}
