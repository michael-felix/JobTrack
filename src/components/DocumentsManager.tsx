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
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-medium">Upload a new version</h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
              >
                <option value="RESUME">Résumé</option>
                <option value="COVER_LETTER">Cover letter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Version label</label>
              <input
                required
                placeholder="e.g. v3 - added AWS"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Change summary</label>
              <input
                placeholder="What changed?"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
              />
            </div>
          </div>

          {manualText === null ? (
            <div>
              <label className="block text-sm font-medium">File (PDF, DOCX, or TXT)</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="mt-1 w-full text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium">Paste text (manual entry fallback)</label>
              <textarea
                rows={6}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload version"}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocumentList title="Résumé versions" documents={resumes} onDelete={handleDelete} />
        <DocumentList title="Cover letter versions" documents={coverLetters} onDelete={handleDelete} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-medium">Compare two versions</h2>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium">From</label>
            <select
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
            >
              <option value="">Select version</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.type === "RESUME" ? "Résumé" : "Cover letter"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">To</label>
            <select
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            >
              <option value="">Select version</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.type === "RESUME" ? "Résumé" : "Cover letter"})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={diffing || !fromId || !toId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {diffing ? "Comparing…" : "Compare"}
          </button>
        </div>

        {diffParts && (
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
            {diffParts.map((part, i) => (
              <span
                key={i}
                className={
                  part.type === "added"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                    : part.type === "removed"
                    ? "bg-red-100 text-red-800 line-through dark:bg-red-900/50 dark:text-red-300"
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-medium">{title}</h2>
      {documents.length === 0 && <p className="text-sm text-slate-400">No versions uploaded yet.</p>}
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-start justify-between rounded-md border border-slate-100 p-2 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium">{doc.label}</p>
              <p className="text-xs text-slate-400">
                {doc.fileName} · {new Date(doc.createdAt).toLocaleDateString()}
              </p>
              {doc.changeSummary && <p className="text-xs text-slate-500">{doc.changeSummary}</p>}
            </div>
            <button onClick={() => onDelete(doc.id)} className="text-xs text-red-600 hover:underline">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
