"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/Spinner";

function GmailStatusBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("gmail") !== "error") return null;
  return (
    <p className="mb-3 text-sm text-stage-rejected dark:text-stage-dark-rejected">
      Failed to connect Gmail. Please try again.
    </p>
  );
}

export function GmailConnectionManager({ initialConnectedEmail }: { initialConnectedEmail: string | null }) {
  const [connectedEmail, setConnectedEmail] = useState(initialConnectedEmail);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/gmail/disconnect", { method: "DELETE" });
    if (res.ok) setConnectedEmail(null);
    setDisconnecting(false);
  }

  return (
    <section className="card">
      <h2 className="mb-1 font-medium">Gmail rejection detection</h2>
      <p className="mb-3 text-sm text-ink-muted dark:text-ink-muted-dark">
        Connect Gmail to scan for likely rejection emails from the board with one click. This only reads message
        subjects/snippets matching a rejection-shaped search when you click "Check inbox" — nothing runs in the
        background, and no stage ever changes automatically; you approve every suggested update yourself. Google
        will show an "unverified app" warning during sign-in since this is a personal, unpublished app — that's
        expected.
      </p>
      <Suspense fallback={null}>
        <GmailStatusBanner />
      </Suspense>
      {connectedEmail ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Connected as <span className="font-medium">{connectedEmail}</span>
          </span>
          <button onClick={handleDisconnect} disabled={disconnecting} className="btn-secondary py-1 text-xs">
            {disconnecting && <Spinner className="h-3 w-3" />}
            Disconnect
          </button>
        </div>
      ) : (
        <a href="/api/gmail/connect" className="btn-primary inline-flex">
          Connect Gmail
        </a>
      )}
    </section>
  );
}
