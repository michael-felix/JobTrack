export default function BoardLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-hairline/60 dark:bg-hairline-dark/60" />
      <div className="mb-5 flex justify-end">
        <div className="h-9 w-40 animate-pulse rounded-md bg-hairline/60 dark:bg-hairline-dark/60" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, col) => (
          <div key={col} className="min-h-[300px] rounded-xl border border-hairline/70 bg-surface/40 p-2.5 dark:border-hairline-dark/70 dark:bg-surface-dark/30">
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-hairline/60 px-1 dark:bg-hairline-dark/60" />
            <div className="space-y-2">
              {Array.from({ length: col === 0 ? 3 : 1 }).map((__, card) => (
                <div
                  key={card}
                  className="h-20 animate-pulse rounded-lg border border-hairline bg-surface dark:border-hairline-dark dark:bg-surface-dark"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
