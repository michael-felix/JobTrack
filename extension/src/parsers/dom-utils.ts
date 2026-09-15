/** Returns trimmed, whitespace-collapsed text for the first selector (in
 * order) that matches and has non-empty content, else undefined. Trying a
 * short list of selectors per field — rather than one brittle selector —
 * is the main defense against small markup changes on the source site. */
export function firstText(doc: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    const text = el?.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return undefined;
}
