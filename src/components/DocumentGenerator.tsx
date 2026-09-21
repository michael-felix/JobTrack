"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";

interface Props {
  applicationId: string;
  type: "RESUME" | "COVER_LETTER";
  baseDocumentVersionId: string | null;
  company: string;
  jobTitle: string;
  onSaved: (documentVersionId: string) => void;
}

/** Generates a tailored draft of the selected base résumé/cover letter for
 * this job, shows it for review, and only writes a real DocumentVersion if
 * the user explicitly saves it — see the strict "don't invent content"
 * system prompt in src/lib/document-generation.ts for why this is safe to
 * offer without a human reviewing every word first. */
export function DocumentGenerator({ applicationId, type, baseDocumentVersionId, company, jobTitle, onSaved }: Props) {
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = type === "RESUME" ? "résumé" : "cover letter";

  async function handleGenerate() {
    if (!baseDocumentVersionId) {
      setError(`Select a base ${label} above first.`);
      return;
    }
    setError(null);
    setGenerating(true);
    setDraft(null);
    const res = await fetch(`/api/applications/${applicationId}/generate-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, baseDocumentVersionId }),
    });
    const data = await res.json();
    if (res.ok) {
      setDraft(data.text);
    } else {
      setError(data.error ?? "Failed to generate a draft.");
    }
    setGenerating(false);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("label", `AI draft — ${company}`);
    formData.set("text", draft);
    formData.set("changeSummary", `Tailored for ${jobTitle} at ${company}`);
    const res = await fetch("/api/documents", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      onSaved(data.document.id);
      setDraft(null);
    } else {
      setError(data.error ?? "Failed to save the draft.");
    }
    setSaving(false);
  }

  return (
    <div className="border-t border-hairline pt-4 dark:border-hairline-dark">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Generate a tailored {label}</p>
          <p className="text-xs text-ink-faint dark:text-ink-faint-dark">
            AI reorganizes your selected {label} for this job — review before saving. It won&apos;t invent
            anything beyond what&apos;s already in your document.
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-secondary shrink-0">
          {generating && <Spinner className="h-4 w-4" />}
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}
      {draft && (
        <div className="mt-3 space-y-2">
          <textarea
            className="field-input mt-0 h-64 font-mono text-xs leading-relaxed"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <Spinner className="h-4 w-4" />}
              Save as new version
            </button>
            <button
              onClick={() => setDraft(null)}
              className="text-sm font-medium text-ink-faint hover:text-ink-muted dark:text-ink-faint-dark dark:hover:text-ink-muted-dark"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
