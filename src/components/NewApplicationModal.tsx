"use client";

import { useState } from "react";
import { ApplicationSummary } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

export function NewApplicationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (application: ApplicationSummary) => void;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, location, salary, jobUrl, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create application.");
      onCreated(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/30 px-4 backdrop-blur-[2px] dark:bg-black/50">
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-hairline bg-surface p-6 shadow-lg dark:border-hairline-dark dark:bg-surface-dark">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="heading text-xl">Add job application</h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink dark:text-ink-faint-dark dark:hover:text-ink-dark"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title" required value={jobTitle} onChange={setJobTitle} />
            <Field label="Company" required value={company} onChange={setCompany} />
            <Field label="Location" value={location} onChange={setLocation} />
            <Field label="Salary" value={salary} onChange={setSalary} />
          </div>
          <Field label="Job posting URL" value={jobUrl} onChange={setJobUrl} />
          <div>
            <label className="field-label">Job description</label>
            <textarea
              rows={5}
              className="field-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-faint dark:text-ink-faint-dark">
              Paste the full posting so résumé match scoring has something to compare against.
            </p>
          </div>
          {error && <p className="text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input required={required} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
