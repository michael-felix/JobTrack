export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="heading mb-1 text-center text-3xl italic">JobTrack</h1>
        <p className="mb-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          Your applications, résumés, and interview prep — in one place.
        </p>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
