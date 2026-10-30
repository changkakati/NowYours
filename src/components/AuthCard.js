import Link from "next/link";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <section className="w-full max-w-sm">
          {/* Logo */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-slate-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-4 focus-visible:rounded"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              N
            </span>
            <span className="text-base font-semibold tracking-tight">
              NowYours
            </span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-slate-500">
              {footer}
            </div>
          )}
        </section>
      </div>

      <footer className="px-4 py-6 text-center text-xs text-slate-400">
        © 2026 NowYours
      </footer>
    </main>
  );
}