import { ApplicationStage } from "@/lib/types";

/**
 * "Needs attention" heuristics — the things a spreadsheet can't surface on
 * its own without you manually eyeballing dates across every row. All of
 * this is computed client-side from fields already in ApplicationSummary,
 * so it needs no schema change and stays in sync with whatever the server
 * last returned.
 */

export const STALE_DAYS = 21;
export const SUGGEST_REJECT_DAYS = 45;

const TERMINAL_STAGES: ApplicationStage[] = ["OFFER", "REJECTED"];

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

/** No stage change or note in STALE_DAYS, and not already in a terminal
 * stage — worth a visual nudge, not yet worth suggesting rejection. */
export function isStale(app: { stage: ApplicationStage; updatedAt: string }): boolean {
  return !TERMINAL_STAGES.includes(app.stage) && daysSince(app.updatedAt) >= STALE_DAYS;
}

/** Stale for long enough that the job has likely moved on without a
 * response — worth actively prompting the user to close it out. */
export function suggestsRejection(app: { stage: ApplicationStage; updatedAt: string }): boolean {
  return !TERMINAL_STAGES.includes(app.stage) && daysSince(app.updatedAt) >= SUGGEST_REJECT_DAYS;
}

export function isFollowUpOverdue(app: { stage: ApplicationStage; followUpDate: string | null }): boolean {
  if (!app.followUpDate || TERMINAL_STAGES.includes(app.stage)) return false;
  return new Date(app.followUpDate).getTime() < Date.now();
}
