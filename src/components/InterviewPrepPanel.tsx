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
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-medium">Interview preparation</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Company research</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={companyResearch}
            onChange={(e) => setCompanyResearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Technical questions (one per line)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={technicalQuestions}
              onChange={(e) => setTechnicalQuestions(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Behavioral questions (one per line)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={behavioralQuestions}
              onChange={(e) => setBehavioralQuestions(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Preparation checklist</label>
          <ul className="mb-2 space-y-1">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(i)} />
                <span className={item.done ? "text-slate-400 line-through" : ""}>{item.text}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Add checklist item…"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
            />
            <button
              onClick={addChecklistItem}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">General notes</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save interview prep"}
          </button>
          {savedAt && <span className="text-xs text-slate-400">Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
      </div>
    </section>
  );
}
