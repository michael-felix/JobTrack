"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { email, password, name } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      router.push("/board");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <div>
        <label className="field-label">Email</label>
        <input
          type="email"
          required
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Password</label>
        <input
          type="password"
          required
          minLength={8}
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>
      <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <a href="/signup" className="font-medium text-accent hover:underline dark:text-accent-dark">
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="font-medium text-accent hover:underline dark:text-accent-dark">
              Log in
            </a>
          </>
        )}
      </p>
    </form>
  );
}
