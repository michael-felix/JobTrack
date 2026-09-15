"use client";

import { useState } from "react";
import { DocumentVersionSummary, MatchScoreData } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

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
    <section className="card">
      <h2 className="mb-3 font-medium">Documents &amp; match score</h2>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Résumé version used</label>
          <select
            className="field-input"
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
          <label className="field-label">Cover letter version used</label>
          <select
            className="field-input"
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
        <p className="text-sm text-ink-faint dark:text-ink-faint-dark">
          Add a job description to this application to enable match scoring.
        </p>
      )}

      {jobDescription && (
        <button onClick={handleCompute} disabled={computing} className="btn-primary">
          {computing && <Spinner className="h-4 w-4" />}
          {computing ? "Scoring…" : "Recompute match score"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}

      {latestMatchScore && (
        <div className="mt-5 space-y-4 border-t border-hairline pt-4 dark:border-hairline-dark">
          <div className="flex items-baseline gap-3">
            <div className="font-serif text-4xl font-semibold text-accent dark:text-accent-dark">
              {latestMatchScore.score}%
            </div>
            <span className="text-sm text-ink-faint dark:text-ink-faint-dark">
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
      ? "bg-stage-offer/15 text-stage-offer dark:bg-stage-dark-offer/20 dark:text-stage-dark-offer"
      : tone === "bad"
      ? "bg-stage-rejected/15 text-stage-rejected dark:bg-stage-dark-rejected/20 dark:text-stage-dark-rejected"
      : "bg-accent-soft text-ink-muted dark:bg-accent-soft-dark dark:text-ink-muted-dark";

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`tag ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
