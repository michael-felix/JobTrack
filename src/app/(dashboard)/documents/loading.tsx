export default function DocumentsLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
      <div className="card">
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-hairline/40 dark:bg-hairline-dark/40" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card space-y-2">
            <div className="mb-2 h-4 w-32 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
            <div className="h-12 animate-pulse rounded-md bg-hairline/40 dark:bg-hairline-dark/40" />
            <div className="h-12 animate-pulse rounded-md bg-hairline/40 dark:bg-hairline-dark/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
