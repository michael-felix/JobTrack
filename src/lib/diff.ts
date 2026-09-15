import { diffWords } from "diff";

export type DiffPartType = "added" | "removed" | "unchanged";

export interface DiffPart {
  type: DiffPartType;
  value: string;
}

/** Word-level diff between two document version texts, used to render an
 * "what changed between versions" view. */
export function diffVersions(previousText: string, nextText: string): DiffPart[] {
  return diffWords(previousText, nextText).map((part) => ({
    type: part.added ? "added" : part.removed ? "removed" : "unchanged",
    value: part.value,
  }));
}
