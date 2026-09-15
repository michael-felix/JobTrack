"use client";

import { useRouter } from "next/navigation";

export function NavBar({ userName }: { userName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-6">
        <a href="/board" className="text-lg font-semibold">JobTrack AI</a>
        <a href="/board" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          Board
        </a>
        <a href="/documents" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          Résumés &amp; Cover Letters
        </a>
        <a href="/settings" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          Settings
        </a>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{userName}</span>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
