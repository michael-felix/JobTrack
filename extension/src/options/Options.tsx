import { useEffect, useState } from "react";
import { getConfig, originPatternFor, setConfig } from "@/lib/storage";

export function Options() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
  const [apiToken, setApiToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
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

    try {
      const pattern = originPatternFor(apiBaseUrl);
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (!granted) {
        setStatus("Permission to reach that URL was denied — the extension can't send captures without it.");
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
      } else {
        setStatus("Saved, but the connection test failed — check the URL and token.");
      }
    } catch {
      setStatus("Saved, but couldn't reach that URL to verify the connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>JobTrack AI — Extension settings</h1>
      <p>
        Generate a token from your JobTrack AI account's Settings page, then paste it here. This token
        can only create new saved applications in your account — it can&apos;t read, edit, or delete
        anything.
      </p>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 12 }}>
          <label>
            JobTrack AI URL
            <input
              type="url"
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Access token
            <input
              type="password"
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save & test connection"}
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
