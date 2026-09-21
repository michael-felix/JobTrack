"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStage, STAGE_LABELS } from "@/lib/types";

interface SearchResult {
  id: string;
  company: string;
  jobTitle: string;
  stage: ApplicationStage;
}

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/applications/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.applications);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/applications/${id}`);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        className="field-input mt-0 w-full text-sm"
        placeholder="Search everything — notes, job descriptions…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-hairline bg-surface py-1 shadow-md dark:border-hairline-dark dark:bg-surface-dark">
          {loading && <p className="px-3 py-2 text-sm text-ink-faint dark:text-ink-faint-dark">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-faint dark:text-ink-faint-dark">No matches.</p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent-soft/40 dark:hover:bg-accent-soft-dark/40"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-ink dark:text-ink-dark">{r.company}</span>{" "}
                  <span className="text-ink-muted dark:text-ink-muted-dark">{r.jobTitle}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-faint dark:text-ink-faint-dark">
                  {STAGE_LABELS[r.stage]}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
