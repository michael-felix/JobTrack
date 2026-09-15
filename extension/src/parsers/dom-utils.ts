/** Returns trimmed, whitespace-collapsed text for the first selector (in
 * order) that has any matching element with non-empty content, else
 * undefined. Trying a short list of selectors per field — rather than one
 * brittle selector — is the main defense against small markup changes on
 * the source site.
 *
 * Checks every element matching a selector, not just the first: sites that
 * render (invalid) nested `<a>` tags get them split apart by the HTML
 * parser's adoption-agency algorithm when the page's live DOM is serialized
 * and re-parsed (as this extension does), leaving the outer anchor empty
 * and the real text on a later match for the same selector. */
export function firstText(doc: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    for (const el of doc.querySelectorAll(selector)) {
      const text = el.textContent?.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  }
  return undefined;
}
