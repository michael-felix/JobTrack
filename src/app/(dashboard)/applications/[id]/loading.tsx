export default function ApplicationDetailLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
          <div className="h-4 w-48 animate-pulse rounded bg-hairline/40 dark:bg-hairline-dark/40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 animate-pulse rounded-md bg-hairline/50 dark:bg-hairline-dark/50" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-hairline/50 dark:bg-hairline-dark/50" />
        </div>
      </div>
      <div className="mb-6 flex gap-4 border-b border-hairline pb-2 dark:border-hairline-dark">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-24 animate-pulse rounded bg-hairline/50 dark:bg-hairline-dark/50" />
        ))}
      </div>
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
