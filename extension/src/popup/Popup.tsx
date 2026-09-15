import { useEffect, useState } from "react";
import { getConfig } from "@/lib/storage";
import { parseJobPosting } from "@/parsers/index";

interface FormState {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  jobDescription: string;
  jobUrl: string;
}

const EMPTY_FORM: FormState = {
  jobTitle: "",
  company: "",
  location: "",
  salary: "",
  jobDescription: "",
  jobUrl: "",
};

type LoadState = "loading" | "not-configured" | "ready";

export function Popup() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [parseFailed, setParseFailed] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadAndParse();
  }, []);

  async function loadAndParse() {
    const config = await getConfig();
    if (!config) {
      setLoadState("not-configured");
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      setLoadState("ready");
      setParseFailed(true);
      return;
    }

    try {
      const [{ result: html }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML,
      });

      const doc = new DOMParser().parseFromString(html as string, "text/html");
      const parsed = parseJobPosting(doc, tab.url);

      if (parsed) {
        setForm({
          jobTitle: parsed.jobTitle,
          company: parsed.company,
          location: parsed.location ?? "",
          salary: parsed.salary ?? "",
          jobDescription: parsed.jobDescription ?? "",
          jobUrl: parsed.jobUrl,
        });
      } else {
        setParseFailed(true);
        setForm({ ...EMPTY_FORM, jobUrl: tab.url });
      }
    } catch {
      // Can't inject into this tab (e.g. a chrome:// page) — fall back to a
      // blank, manually-fillable form rather than showing a dead end.
      setParseFailed(true);
      setForm({ ...EMPTY_FORM, jobUrl: tab.url });
    }

    setLoadState("ready");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setErrorMessage(null);

    const config = await getConfig();
    if (!config) return;

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/extension/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  if (loadState === "loading") {
    return <p style={{ padding: 16 }}>Loading…</p>;
  }

  if (loadState === "not-configured") {
    return (
      <div style={{ padding: 16 }}>
        <p>Set up your JobTrack AI URL and access token first.</p>
        <button onClick={() => chrome.runtime.openOptionsPage()}>Open settings</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {parseFailed && (
        <p style={{ color: "#b45309", fontSize: 13 }}>
          Couldn&apos;t automatically read this page — fill in the details manually below.
        </p>
      )}
      <form onSubmit={handleSave}>
        <Field label="Job title" value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
        <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
        <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>
          Job description
          <textarea
            rows={4}
            style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
          />
        </label>
        {errorMessage && <p style={{ color: "#dc2626", fontSize: 13 }}>{errorMessage}</p>}
        <button type="submit" disabled={saveState === "saving" || !form.jobTitle || !form.company}>
          {saveState === "saving" ? "Saving…" : "Save to JobTrack"}
        </button>
        {saveState === "saved" && <p style={{ color: "#16a34a", fontSize: 13 }}>Saved ✓</p>}
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
      {label}
      <input
        style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
