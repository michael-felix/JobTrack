"use client";

import { useState } from "react";

interface TokenSummary {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function TokensManager({ initialTokens }: { initialTokens: TokenSummary[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setJustCreatedToken(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create token.");
      setCreating(false);
      return;
    }
    setJustCreatedToken(data.token);
    setTokens((prev) => [
      { id: data.id, label, lastUsedAt: null, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setLabel("");
    setCreating(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this token? Any extension using it will stop working immediately.")) return;
    const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    if (res.ok) setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <section className="card">
      <h2 className="mb-1 font-medium">Chrome extension access tokens</h2>
      <p className="mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">
        Generate a token and paste it into the JobTrack AI extension&apos;s options page. A token can
        only ever create new saved applications — it cannot read, edit, or delete anything in your
        account.
      </p>

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          required
          placeholder="Label, e.g. Work laptop"
          className="field-input mt-0"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit" disabled={creating} className="btn-primary shrink-0">
          {creating ? "Creating…" : "Generate token"}
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}

      {justCreatedToken && (
        <div className="mb-4 rounded-md border border-accent/40 bg-accent-soft p-3 text-sm dark:border-accent-dark/40 dark:bg-accent-soft-dark">
          <p className="mb-1 font-medium">Copy this token now — it won&apos;t be shown again:</p>
          <code className="block break-all rounded bg-surface p-2 dark:bg-surface-dark">{justCreatedToken}</code>
        </div>
      )}

      <ul className="space-y-2">
        {tokens.map((token) => (
          <li
            key={token.id}
            className="flex items-center justify-between rounded-md border border-hairline p-2.5 text-sm dark:border-hairline-dark"
          >
            <div>
              <p className="font-medium">{token.label}</p>
              <p className="text-xs text-ink-faint dark:text-ink-faint-dark">
                Created {new Date(token.createdAt).toLocaleDateString()}
                {token.lastUsedAt ? ` · last used ${new Date(token.lastUsedAt).toLocaleDateString()}` : " · never used"}
              </p>
            </div>
            <button
              onClick={() => handleRevoke(token.id)}
              className="text-xs font-medium text-stage-rejected hover:underline dark:text-stage-dark-rejected"
            >
              Revoke
            </button>
          </li>
        ))}
        {tokens.length === 0 && <p className="text-sm text-ink-faint dark:text-ink-faint-dark">No tokens yet.</p>}
      </ul>
    </section>
  );
}
