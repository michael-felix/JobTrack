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

const BLOCK_TAGS = new Set([
  "P", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "SECTION", "ARTICLE", "BLOCKQUOTE", "TR",
]);

/** Like textContent, but inserts a newline after block-level elements and
 * <br> instead of silently dropping the layout structure — textContent
 * flattens a job description's paragraphs/bullets into one run-on line. */
function blockText(el: Element): string {
  let out = "";
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as Element).tagName;
    if (tag === "BR") {
      out += "\n";
      return;
    }
    for (const child of Array.from(node.childNodes)) walk(child);
    if (BLOCK_TAGS.has(tag) && !out.endsWith("\n")) out += "\n";
  }
  walk(el);
  return out;
}

/** Same selector-fallback strategy as firstText, but for multi-paragraph
 * fields like job descriptions: preserves line breaks between paragraphs
 * and list items instead of collapsing all whitespace to single spaces. */
export function firstBlockText(doc: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    for (const el of doc.querySelectorAll(selector)) {
      const text = blockText(el)
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (text) return text;
    }
  }
  return undefined;
}
