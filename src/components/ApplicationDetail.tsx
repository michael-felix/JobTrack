"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ApplicationDetailData,
  ApplicationStage,
  DocumentVersionSummary,
  STAGES,
  STAGE_LABELS,
} from "@/lib/types";
import { MatchScorePanel } from "@/components/MatchScorePanel";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";

interface Props {
  application: ApplicationDetailData;
  resumes: DocumentVersionSummary[];
  coverLetters: DocumentVersionSummary[];
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "match", label: "Match & documents" },
  { id: "prep", label: "Interview prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ApplicationDetail({ application: initial, resumes, coverLetters }: Props) {
  const router = useRouter();
  const [application, setApplication] = useState(initial);
  const [tab, setTab] = useState<TabId>("overview");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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
    const res = await fetch(`/api/applications/${application.id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStage }),
    });
    if (res.ok) {
      setApplication((prev) => ({ ...prev, stage: toStage }));
      router.refresh();
    }
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
    const res = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    if (res.ok) router.push("/board");
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="heading text-3xl">{application.jobTitle}</h1>
          <p className="mt-1 text-ink-muted dark:text-ink-muted-dark">
            {application.company}
            {application.location ? ` · ${application.location}` : ""}
            {application.salary ? ` · ${application.salary}` : ""}
          </p>
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
          <select
            value={application.stage}
            onChange={(e) => handleStageChange(e.target.value as ApplicationStage)}
            className="field-input mt-0 w-auto"
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <button onClick={handleDelete} className="btn-danger">
            Delete
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

          {application.jobDescription && (
            <section className="card">
              <h2 className="mb-2 font-medium">Job description</h2>
              <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-ink-muted dark:text-ink-muted-dark">
                {application.jobDescription}
              </p>
            </section>
          )}

          <section className="card">
            <h2 className="mb-3 font-medium">Notes &amp; timeline</h2>
            <div className="mb-3 flex gap-2">
              <input
                className="field-input mt-0"
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button onClick={handleAddNote} disabled={savingNote} className="btn-primary shrink-0">
                Add
              </button>
            </div>
            <ul className="space-y-2">
              {application.events.map((event) => (
                <li key={event.id} className="text-sm">
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
  );
}
