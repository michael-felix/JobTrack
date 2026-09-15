"use client";

import { useState } from "react";
import { InterviewPrepData } from "@/lib/types";

interface Props {
  applicationId: string;
  initialPrep: InterviewPrepData | null;
}

export function InterviewPrepPanel({ applicationId, initialPrep }: Props) {
  const [companyResearch, setCompanyResearch] = useState(initialPrep?.companyResearch ?? "");
  const [technicalQuestions, setTechnicalQuestions] = useState(
    (initialPrep?.technicalQuestions ?? []).join("\n")
  );
  const [behavioralQuestions, setBehavioralQuestions] = useState(
    (initialPrep?.behavioralQuestions ?? []).join("\n")
  );
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>(
    initialPrep?.checklist ?? [
      { text: "Research company mission & recent news", done: false },
      { text: "Review job description against résumé", done: false },
      { text: "Prepare questions to ask interviewer", done: false },
    ]
  );
  const [notes, setNotes] = useState(initialPrep?.notes ?? "");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/applications/${applicationId}/interview-prep`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyResearch,
        technicalQuestions: technicalQuestions.split("\n").map((s) => s.trim()).filter(Boolean),
        behavioralQuestions: behavioralQuestions.split("\n").map((s) => s.trim()).filter(Boolean),
        checklist,
        notes,
      }),
    });
    if (res.ok) setSavedAt(new Date());
    setSaving(false);
  }

  function toggleChecklistItem(index: number) {
    setChecklist((items) => items.map((item, i) => (i === index ? { ...item, done: !item.done } : item)));
  }

  function addChecklistItem() {
    if (!newChecklistItem.trim()) return;
    setChecklist((items) => [...items, { text: newChecklistItem.trim(), done: false }]);
    setNewChecklistItem("");
  }

  return (
    <section className="card">
      <h2 className="mb-4 font-medium">Interview preparation</h2>

      <div className="space-y-5">
        <div>
          <label className="field-label">Company research</label>
          <textarea
            rows={3}
            className="field-input"
            value={companyResearch}
            onChange={(e) => setCompanyResearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Technical questions (one per line)</label>
            <textarea
              rows={4}
              className="field-input"
              value={technicalQuestions}
              onChange={(e) => setTechnicalQuestions(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Behavioral questions (one per line)</label>
            <textarea
              rows={4}
              className="field-input"
              value={behavioralQuestions}
              onChange={(e) => setBehavioralQuestions(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label mb-1.5">Preparation checklist</label>
          <ul className="mb-2 space-y-1.5">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(i)}
                  className="h-4 w-4 rounded border-hairline text-accent focus:ring-accent dark:border-hairline-dark"
                />
                <span
                  className={item.done ? "text-ink-faint line-through dark:text-ink-faint-dark" : ""}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className="field-input mt-0"
              placeholder="Add checklist item…"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
            />
            <button onClick={addChecklistItem} className="btn-secondary shrink-0">
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="field-label">General notes</label>
          <textarea rows={3} className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save interview prep"}
          </button>
          {savedAt && (
            <span className="text-xs text-ink-faint dark:text-ink-faint-dark">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
