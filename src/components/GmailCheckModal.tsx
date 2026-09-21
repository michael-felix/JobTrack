"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";

interface Suggestion {
  applicationId: string;
  company: string;
  jobTitle: string;
  subject: string;
  from: string;
  snippet: string;
}

export function GmailCheckModal({
  onClose,
  onMarkedRejected,
}: {
  onClose: () => void;
  onMarkedRejected: (applicationId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/gmail/check-inbox", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error ?? "Failed to check inbox.");
      }
      setLoading(false);
    })();
  }, []);

  async function handleMarkRejected(applicationId: string) {
    setActingId(applicationId);
    const res = await fetch(`/api/applications/${applicationId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStage: "REJECTED" }),
    });
    if (res.ok) {
      onMarkedRejected(applicationId);
      setSuggestions((prev) => prev.filter((s) => s.applicationId !== applicationId));
    }
    setActingId(null);
  }

  function handleIgnore(applicationId: string) {
    setSuggestions((prev) => prev.filter((s) => s.applicationId !== applicationId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-surface p-5 shadow-md dark:border-hairline-dark dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading text-xl">Inbox check</h2>
          <button
            onClick={onClose}
            className="text-sm text-ink-faint hover:text-ink-muted dark:text-ink-faint-dark dark:hover:text-ink-muted-dark"
          >
            Close
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            <Spinner className="h-4 w-4" /> Scanning recent mail…
          </div>
        )}
        {error && <p className="text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}
        {!loading && !error && suggestions.length === 0 && (
          <p className="text-sm text-ink-faint dark:text-ink-faint-dark">
            No likely rejection emails found in the last 45 days.
          </p>
        )}

        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.applicationId} className="rounded-lg border border-hairline p-3 dark:border-hairline-dark">
              <p className="text-sm font-medium">
                {s.company} — {s.jobTitle}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-faint dark:text-ink-faint-dark">{s.subject}</p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted dark:text-ink-muted-dark">{s.snippet}</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => handleMarkRejected(s.applicationId)}
                  disabled={actingId === s.applicationId}
                  className="btn-secondary py-1 text-xs"
                >
                  {actingId === s.applicationId && <Spinner className="h-3 w-3" />}
                  Mark as rejected
                </button>
                <button
                  onClick={() => handleIgnore(s.applicationId)}
                  className="text-xs font-medium text-ink-faint hover:text-ink-muted dark:text-ink-faint-dark dark:hover:text-ink-muted-dark"
                >
                  Ignore
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
