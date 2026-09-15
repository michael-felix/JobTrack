"use client";

import { useState } from "react";
import { DocumentType, DocumentVersionSummary } from "@/lib/types";

interface DiffPart {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export function DocumentsManager({ initialDocuments }: { initialDocuments: DocumentVersionSummary[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [type, setType] = useState<DocumentType>("RESUME");
  const [label, setLabel] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [diffParts, setDiffParts] = useState<DiffPart[] | null>(null);
  const [diffing, setDiffing] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file && !manualText) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("label", label);
    if (changeSummary) formData.set("changeSummary", changeSummary);
    if (manualText !== null) {
      formData.set("text", manualText);
    } else if (file) {
      formData.set("file", file);
    }

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    const data = await res.json();

    if (res.status === 422 && data.fallback === "manual-entry") {
      setError(`${data.error} You can paste the résumé text below instead.`);
      setManualText("");
      setUploading(false);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      setUploading(false);
      return;
    }

    setDocuments((docs) => [data.document, ...docs]);
    setLabel("");
    setChangeSummary("");
    setFile(null);
    setManualText(null);
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this version?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocuments((docs) => docs.filter((d) => d.id !== id));
  }

  async function handleCompare() {
    if (!fromId || !toId) return;
    setDiffing(true);
    const res = await fetch(`/api/documents/diff?from=${fromId}&to=${toId}`);
    const data = await res.json();
    if (res.ok) setDiffParts(data.parts);
    setDiffing(false);
  }

  const resumes = documents.filter((d) => d.type === "RESUME");
  const coverLetters = documents.filter((d) => d.type === "COVER_LETTER");

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="mb-3 font-medium">Upload a new version</h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label">Type</label>
              <select className="field-input" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                <option value="RESUME">Résumé</option>
                <option value="COVER_LETTER">Cover letter</option>
              </select>
            </div>
            <div>
              <label className="field-label">Version label</label>
              <input
                required
                placeholder="e.g. v3 - added AWS"
                className="field-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Change summary</label>
              <input
                placeholder="What changed?"
                className="field-input"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
              />
            </div>
          </div>

          {manualText === null ? (
            <div>
              <label className="field-label">File (PDF, DOCX, or TXT)</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="mt-1.5 block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-hover hover:file:bg-accent-soft/70 dark:text-ink-muted-dark dark:file:bg-accent-soft-dark dark:file:text-accent-dark"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div>
              <label className="field-label">Paste text (manual entry fallback)</label>
              <textarea
                rows={6}
                className="field-input"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}

          <button type="submit" disabled={uploading} className="btn-primary">
            {uploading ? "Uploading…" : "Upload version"}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocumentList title="Résumé versions" documents={resumes} onDelete={handleDelete} />
        <DocumentList title="Cover letter versions" documents={coverLetters} onDelete={handleDelete} />
      </div>

      <section className="card">
        <h2 className="mb-3 font-medium">Compare two versions</h2>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label">From</label>
            <select className="field-input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">Select version</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.type === "RESUME" ? "Résumé" : "Cover letter"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">To</label>
            <select className="field-input" value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">Select version</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.type === "RESUME" ? "Résumé" : "Cover letter"})
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCompare} disabled={diffing || !fromId || !toId} className="btn-primary">
            {diffing ? "Comparing…" : "Compare"}
          </button>
        </div>

        {diffParts && (
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border border-hairline bg-paper p-3 text-sm dark:border-hairline-dark dark:bg-paper-dark">
            {diffParts.map((part, i) => (
              <span
                key={i}
                className={
                  part.type === "added"
                    ? "bg-stage-offer/15 text-stage-offer dark:bg-stage-dark-offer/20 dark:text-stage-dark-offer"
                    : part.type === "removed"
                    ? "bg-stage-rejected/15 text-stage-rejected line-through dark:bg-stage-dark-rejected/20 dark:text-stage-dark-rejected"
                    : ""
                }
              >
                {part.value}
              </span>
            ))}
          </pre>
        )}
      </section>
    </div>
  );
}

function DocumentList({
  title,
  documents,
  onDelete,
}: {
  title: string;
  documents: DocumentVersionSummary[];
  onDelete: (id: string) => void;
}) {
  return (
    <section className="card">
      <h2 className="mb-3 font-medium">{title}</h2>
      {documents.length === 0 && <p className="text-sm text-ink-faint dark:text-ink-faint-dark">No versions uploaded yet.</p>}
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-start justify-between rounded-md border border-hairline p-2.5 transition-colors hover:border-accent/40 hover:bg-accent-soft/30 dark:border-hairline-dark dark:hover:border-accent-dark/40 dark:hover:bg-accent-soft-dark/30"
          >
            <div>
              <p className="text-sm font-medium">{doc.label}</p>
              <p className="text-xs text-ink-faint dark:text-ink-faint-dark">
                {doc.fileName} · {new Date(doc.createdAt).toLocaleDateString()}
              </p>
              {doc.changeSummary && (
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{doc.changeSummary}</p>
              )}
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="text-xs font-medium text-stage-rejected hover:underline dark:text-stage-dark-rejected"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
