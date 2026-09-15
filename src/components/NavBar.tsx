"use client";

import { useRouter, usePathname } from "next/navigation";

const LINKS = [
  { href: "/board", label: "Board" },
  { href: "/documents", label: "Résumés & Cover Letters" },
  { href: "/settings", label: "Settings" },
];

export function NavBar({ userName }: { userName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-hairline bg-surface dark:border-hairline-dark dark:bg-surface-dark">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <a href="/board" className="heading text-xl italic">
            JobTrack
          </a>
          <div className="flex items-center gap-5">
            {LINKS.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    active
                      ? "font-medium text-accent dark:text-accent-dark"
                      : "text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-muted dark:text-ink-muted-dark">{userName}</span>
          <button onClick={handleLogout} className="btn-secondary py-1.5">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
