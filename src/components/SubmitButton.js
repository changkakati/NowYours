export default function SubmitButton({ children, loading, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        inline-flex w-full items-center justify-center gap-2
        rounded-lg bg-slate-900 px-4 py-2.5
        text-sm font-medium text-white
        transition
        hover:bg-slate-800
        active:bg-slate-950
        disabled:cursor-not-allowed disabled:opacity-70
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2
      "
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}