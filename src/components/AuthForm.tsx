"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
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
        <div className="relative mt-1.5">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            className="field-input mt-0 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      {mode === "signup" && (
        <div>
          <label className="field-label">Confirm password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-stage-rejected dark:text-stage-dark-rejected">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting && <Spinner className="h-4 w-4" />}
        {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>
      <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline dark:text-accent-dark">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline dark:text-accent-dark">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 5.2A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.6 8.5 1.5 12 1.5 12S5 19 12 19a10.6 10.6 0 0 0 4.4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
