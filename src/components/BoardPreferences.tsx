"use client";

import { useState } from "react";
import { SORT_ORDER_LABELS, SortOrder } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

const SORT_ORDERS = Object.keys(SORT_ORDER_LABELS) as SortOrder[];

export function BoardPreferences({ initialSortOrder }: { initialSortOrder: SortOrder }) {
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleChange(value: SortOrder) {
    setSortOrder(value);
    setSaving(true);
    setSavedAt(null);
    const res = await fetch("/api/user/sort-order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: value }),
    });
    if (res.ok) setSavedAt(new Date());
    setSaving(false);
  }

  return (
    <section className="card">
      <h2 className="mb-1 font-medium">Board order</h2>
      <p className="mb-3 text-sm text-ink-muted dark:text-ink-muted-dark">
        How applications are ordered within each column (pinned applications always come first
        regardless of this setting).
      </p>
      <div className="flex items-center gap-3">
        <select
          value={sortOrder}
          onChange={(e) => handleChange(e.target.value as SortOrder)}
          className="field-input mt-0 w-auto"
        >
          {SORT_ORDERS.map((order) => (
            <option key={order} value={order}>
              {SORT_ORDER_LABELS[order]}
            </option>
          ))}
        </select>
        {saving && <Spinner className="h-4 w-4 text-accent dark:text-accent-dark" />}
        {!saving && savedAt && (
          <span className="text-xs text-ink-faint dark:text-ink-faint-dark">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </section>
  );
}
