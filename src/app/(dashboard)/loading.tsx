export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <svg
        className="h-6 w-6 animate-spin text-accent dark:text-accent-dark"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
    </div>
  );
}
