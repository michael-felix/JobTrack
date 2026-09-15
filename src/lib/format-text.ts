/** Normalizes messy pasted/scraped text for display: collapses trailing
 * spaces per line and runs of 3+ blank lines down to one blank line,
 * without touching intentional single line breaks (unlike a flat
 * whitespace collapse, which would flatten paragraphs into one run-on
 * line). */
export function cleanMultilineText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
