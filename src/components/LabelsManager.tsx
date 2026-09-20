"use client";

import { useState } from "react";
import { LabelData } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

// A curated palette rather than a free-form color picker, so user labels
// stay visually consistent with the rest of the app instead of clashing.
const PALETTE = [
  "#BD5B36", // accent (terracotta)
  "#A9822A", // gold
  "#8B6A9C", // plum
  "#4C7A5B", // sage
  "#A14B3F", // brick
  "#4C6E8C", // slate blue
  "#8C8170", // stone
  "#B5574A", // clay
];

export function LabelsManager({ initialLabels }: { initialLabels: LabelData[] }) {
  const [labels, setLabels] = useState(initialLabels);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create label.");
      setCreating(false);
      return;
    }
    setLabels((prev) => [...prev, data.label]);
    setName("");
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this label? Applications using it will just become unlabeled.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } else {
      setDeletingId(null);
    }
  }

  return (
    <section className="card">
      <h2 className="mb-1 font-medium">Labels</h2>
      <p className="mb-3 text-sm text-ink-muted dark:text-ink-muted-dark">
        Colored labels for grouping applications on the board — assign one from any
        application&apos;s detail page.
      </p>

      <form onSubmit={handleCreate} className="mb-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="field-label">Name</label>
            <input
              required
              maxLength={40}
              placeholder="e.g. Dream job"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button type="submit" disabled={creating} className="btn-primary shrink-0">
            {creating && <Spinner className="h-4 w-4" />}
            Add label
          </button>
        </div>
        <div>
          <label className="field-label mb-1.5">Color</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={swatch}
                className={`h-6 w-6 rounded-full transition-transform ${
                  color === swatch ? "scale-110 ring-2 ring-offset-2 ring-offset-surface dark:ring-offset-surface-dark" : ""
                }`}
                style={{ backgroundColor: swatch, ...(color === swatch ? { boxShadow: `0 0 0 2px ${swatch}` } : {}) }}
              />
            ))}
          </div>
        </div>
      </form>

      {error && <p className="mb-3 text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}

      <ul className="space-y-2">
        {labels.map((label) => (
          <li
            key={label.id}
            className="flex items-center justify-between rounded-md border border-hairline p-2.5 text-sm dark:border-hairline-dark"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
              {label.name}
            </span>
            <button
              onClick={() => handleDelete(label.id)}
              disabled={deletingId === label.id}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stage-rejected hover:underline disabled:opacity-50 dark:text-stage-dark-rejected"
            >
              {deletingId === label.id && <Spinner className="h-3 w-3" />}
              Delete
            </button>
          </li>
        ))}
        {labels.length === 0 && <p className="text-sm text-ink-faint dark:text-ink-faint-dark">No labels yet.</p>}
      </ul>
    </section>
  );
}
