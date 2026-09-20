"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ApplicationDetailData,
  ApplicationStage,
  DocumentVersionSummary,
  LabelData,
  STAGES,
  STAGE_LABELS,
} from "@/lib/types";
import { cleanMultilineText } from "@/lib/format-text";
import { MatchScorePanel } from "@/components/MatchScorePanel";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { Spinner } from "@/components/Spinner";

const DESCRIPTION_PREVIEW_LENGTH = 600;

interface Props {
  application: ApplicationDetailData;
  resumes: DocumentVersionSummary[];
  coverLetters: DocumentVersionSummary[];
  labels: LabelData[];
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "match", label: "Match & documents" },
  { id: "prep", label: "Interview prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ApplicationDetail({ application: initial, resumes, coverLetters, labels }: Props) {
  const router = useRouter();
  const [application, setApplication] = useState(initial);
  const [tab, setTab] = useState<TabId>("overview");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStage, setChangingStage] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    const res = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (res.ok) {
      setApplication((prev) => ({ ...prev, ...data.application }));
    }
  }

  async function handleStageChange(toStage: ApplicationStage) {
    if (toStage === application.stage) return;
    setChangingStage(true);
    const res = await fetch(`/api/applications/${application.id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStage }),
    });
    if (res.ok) {
      setApplication((prev) => ({ ...prev, stage: toStage }));
      router.refresh();
    }
    setChangingStage(false);
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/applications/${application.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText }),
    });
    const data = await res.json();
    if (res.ok) {
      setApplication((prev) => ({ ...prev, events: [data.event, ...prev.events] }));
      setNoteText("");
    }
    setSavingNote(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/board");
    } else {
      setDeleting(false);
    }
  }

  async function handleTogglePin() {
    await patch({ pinned: !application.pinned });
  }

  async function handleLabelChange(labelId: string) {
    await patch({ labelId: labelId || null });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading text-3xl">{application.jobTitle}</h1>
            <button
              onClick={handleTogglePin}
              title={application.pinned ? "Unpin" : "Pin to top"}
              className={`rounded-md p-1 transition-colors ${
                application.pinned
                  ? "text-accent dark:text-accent-dark"
                  : "text-ink-faint hover:text-accent dark:text-ink-faint-dark dark:hover:text-accent-dark"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={application.pinned ? "currentColor" : "none"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L14 8L20 10L14.5 14L16 21L12 17.5L8 21L9.5 14L4 10L10 8L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-ink-muted dark:text-ink-muted-dark">
            {application.company}
            {application.location ? ` · ${application.location}` : ""}
            {application.salary ? ` · ${application.salary}` : ""}
            {" · "}
            Submitted {new Date(application.dateCaptured).toLocaleDateString()}
          </p>
          <div className="mt-2">
            <select
              value={application.label?.id ?? ""}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="field-input mt-0 w-auto text-sm"
              style={application.label ? { color: application.label.color } : undefined}
            >
              <option value="">No label</option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-accent hover:underline dark:text-accent-dark"
            >
              View original posting ↗
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={application.stage}
              onChange={(e) => handleStageChange(e.target.value as ApplicationStage)}
              disabled={changingStage}
              className="field-input mt-0 w-auto"
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
            {changingStage && (
              <Spinner className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent dark:text-accent-dark" />
            )}
          </div>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting && <Spinner className="h-4 w-4" />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-hairline dark:border-hairline-dark">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-accent text-accent dark:border-accent-dark dark:text-accent-dark"
                : "border-transparent text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-slide-up">
        {tab === "overview" && (
          <div className="space-y-5">
            <section className="card">
              <h2 className="mb-2 font-medium">Follow-up date</h2>
              <input
                type="date"
                className="field-input mt-0 w-auto"
                value={application.followUpDate ? application.followUpDate.slice(0, 10) : ""}
                onChange={(e) =>
                  patch({ followUpDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
              />
            </section>

            {application.jobDescription && <JobDescription text={application.jobDescription} />}

            {application.notes && (
              <section className="card">
                <h2 className="mb-2 font-medium">Notes</h2>
                <p className="whitespace-pre-wrap text-sm text-ink-muted dark:text-ink-muted-dark">
                  {application.notes}
                </p>
              </section>
            )}

            <section className="card">
              <h2 className="mb-3 font-medium">Activity timeline</h2>
              <div className="mb-3 flex gap-2">
                <input
                  className="field-input mt-0"
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <button onClick={handleAddNote} disabled={savingNote} className="btn-primary shrink-0">
                  {savingNote && <Spinner className="h-4 w-4" />}
                  Add
                </button>
              </div>
              <ul className="space-y-1">
                {application.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent-soft/40 dark:hover:bg-accent-soft-dark/40"
                  >
                    <span className="text-ink-faint dark:text-ink-faint-dark">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                    {event.fromStage && event.fromStage !== event.toStage && (
                      <span className="ml-2 text-ink-muted dark:text-ink-muted-dark">
                        {STAGE_LABELS[event.fromStage]} → {STAGE_LABELS[event.toStage]}
                      </span>
                    )}
                    {event.note && <span className="ml-2">{event.note}</span>}
                  </li>
                ))}
                {application.events.length === 0 && (
                  <p className="text-sm text-ink-faint dark:text-ink-faint-dark">No activity yet.</p>
                )}
              </ul>
            </section>
          </div>
        )}

        {tab === "match" && (
          <MatchScorePanel
            applicationId={application.id}
            jobDescription={application.jobDescription}
            resumes={resumes}
            resumeVersionId={application.resumeVersionId}
            coverLetters={coverLetters}
            coverLetterVersionId={application.coverLetterVersionId}
            latestMatchScore={application.matchScores[0] ?? null}
            onDocumentsChange={(fields) => patch(fields)}
            onMatchScoreComputed={(matchScore) =>
              setApplication((prev) => ({ ...prev, matchScores: [matchScore, ...prev.matchScores] }))
            }
          />
        )}

        {tab === "prep" && (
          <InterviewPrepPanel applicationId={application.id} initialPrep={application.interviewPrep} />
        )}
      </div>
    </div>
  );
}

function JobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const cleaned = cleanMultilineText(text);
  const isLong = cleaned.length > DESCRIPTION_PREVIEW_LENGTH;
  const shown = expanded || !isLong ? cleaned : cleaned.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd() + "…";

  return (
    <section className="card">
      <h2 className="mb-2 font-medium">Job description</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted dark:text-ink-muted-dark">
        {shown}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-accent hover:underline dark:text-accent-dark"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}
