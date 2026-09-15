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

export function ApplicationDetail({ application: initial, resumes, coverLetters }: Props) {
  const router = useRouter();
  const [application, setApplication] = useState(initial);
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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{application.jobTitle}</h1>
          <p className="text-slate-500">
            {application.company}
            {application.location ? ` · ${application.location}` : ""}
            {application.salary ? ` · ${application.salary}` : ""}
          </p>
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View original posting ↗
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={application.stage}
            onChange={(e) => handleStageChange(e.target.value as ApplicationStage)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 font-medium">Follow-up date</h2>
        <input
          type="date"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          value={application.followUpDate ? application.followUpDate.slice(0, 10) : ""}
          onChange={(e) =>
            patch({ followUpDate: e.target.value ? new Date(e.target.value).toISOString() : null })
          }
        />
      </section>

      {application.jobDescription && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 font-medium">Job description</h2>
          <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {application.jobDescription}
          </p>
        </section>
      )}

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

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 font-medium">Notes &amp; timeline</h2>
        <div className="mb-3 flex gap-2">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Add a note…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            disabled={savingNote}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {application.events.map((event) => (
            <li key={event.id} className="text-sm">
              <span className="text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
              {event.fromStage && event.fromStage !== event.toStage && (
                <span className="ml-2 text-slate-500">
                  {STAGE_LABELS[event.fromStage]} → {STAGE_LABELS[event.toStage]}
                </span>
              )}
              {event.note && <span className="ml-2">{event.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <InterviewPrepPanel applicationId={application.id} initialPrep={application.interviewPrep} />
    </div>
  );
}
