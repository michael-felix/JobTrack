export default function SettingsLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
      <div className="card space-y-3">
        <div className="h-4 w-64 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-hairline/40 dark:bg-hairline-dark/40" />
        <div className="h-9 w-full animate-pulse rounded-md bg-hairline/40 dark:bg-hairline-dark/40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-hairline/30 dark:bg-hairline-dark/30" />
        ))}
      </div>
    </div>
  );
}
