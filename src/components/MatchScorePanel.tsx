"use client";

import { useState } from "react";
import { DocumentVersionSummary, MatchScoreData } from "@/lib/types";

interface Props {
  applicationId: string;
  jobDescription: string | null;
  resumes: DocumentVersionSummary[];
  resumeVersionId: string | null;
  coverLetters: DocumentVersionSummary[];
  coverLetterVersionId: string | null;
  latestMatchScore: MatchScoreData | null;
  onDocumentsChange: (fields: Record<string, unknown>) => void;
  onMatchScoreComputed: (matchScore: MatchScoreData) => void;
}

export function MatchScorePanel({
  applicationId,
  jobDescription,
  resumes,
  resumeVersionId,
  coverLetters,
  coverLetterVersionId,
  latestMatchScore,
  onDocumentsChange,
  onMatchScoreComputed,
}: Props) {
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompute() {
    if (!resumeVersionId) {
      setError("Select a résumé version first.");
      return;
    }
    setComputing(true);
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}/match-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentVersionId: resumeVersionId }),
    });
    const data = await res.json();
    if (res.ok) {
      onMatchScoreComputed(data.matchScore);
    } else {
      setError(data.error ?? "Failed to compute match score.");
    }
    setComputing(false);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-medium">Documents &amp; match score</h2>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Résumé version used</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={resumeVersionId ?? ""}
            onChange={(e) => onDocumentsChange({ resumeVersionId: e.target.value || null })}
          >
            <option value="">None selected</option>
            {resumes.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Cover letter version used</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={coverLetterVersionId ?? ""}
            onChange={(e) => onDocumentsChange({ coverLetterVersionId: e.target.value || null })}
          >
            <option value="">None selected</option>
            {coverLetters.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!jobDescription && (
        <p className="text-sm text-slate-400">Add a job description to this application to enable match scoring.</p>
      )}

      {jobDescription && (
        <button
          onClick={handleCompute}
          disabled={computing}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {computing ? "Scoring…" : "Recompute match score"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {latestMatchScore && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{latestMatchScore.score}%</div>
            <span className="text-sm text-slate-400">
              computed {new Date(latestMatchScore.createdAt).toLocaleString()}
            </span>
          </div>
          <KeywordList title="Strengths (matched skills)" items={latestMatchScore.strengths} tone="good" />
          <KeywordList title="Missing skills" items={latestMatchScore.missingSkills} tone="bad" />
          <KeywordList title="Missing keywords" items={latestMatchScore.missingKeywords} tone="neutral" />
        </div>
      )}
    </section>
  );
}

function KeywordList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "bad" | "neutral" }) {
  if (items.length === 0) return null;
  const toneClass =
    tone === "good"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : tone === "bad"
      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-2.5 py-0.5 text-xs ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
