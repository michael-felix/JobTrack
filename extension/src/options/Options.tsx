import { useEffect, useState } from "react";
import { getConfig, originPatternFor, setConfig } from "@/lib/storage";

export function Options() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
  const [apiToken, setApiToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error" | "success">("neutral");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfig().then((config) => {
      if (config) {
        setApiBaseUrl(config.apiBaseUrl);
        setApiToken(config.apiToken);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setStatusTone("neutral");

    try {
      const pattern = originPatternFor(apiBaseUrl);
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (!granted) {
        setStatus("Permission to reach that URL was denied — the extension can't send captures without it.");
        setStatusTone("error");
        setSaving(false);
        return;
      }

      await setConfig({ apiBaseUrl, apiToken });
      setStatus("Saved. Testing connection…");

      const res = await fetch(`${apiBaseUrl}/api/extension/verify`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(`Connected as ${data.email}.`);
        setStatusTone("success");
      } else {
        setStatus("Saved, but the connection test failed — check the URL and token.");
        setStatusTone("error");
      }
    } catch {
      setStatus("Saved, but couldn't reach that URL to verify the connection.");
      setStatusTone("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="brand" style={{ fontSize: 24 }}>
        JobTrack
      </p>
      <p className="subtitle">
        Generate a token from your JobTrack AI account&apos;s Settings page, then paste it here. This
        token can only create new saved applications in your account — it can&apos;t read, edit, or
        delete anything.
      </p>
      <form onSubmit={handleSave}>
        <label className="field">
          <span className="field-label">JobTrack AI URL</span>
          <input
            type="url"
            required
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Access token</span>
          <input type="password" required value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save & test connection"}
        </button>
      </form>
      {status && (
        <p className={`status ${statusTone === "error" ? "status-error" : statusTone === "success" ? "status-success" : ""}`}>
          {status}
        </p>
      )}
    </div>
  );
}
