import Link from "next/link";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link
          href="/auth/login"
          className="mb-8 inline-flex items-center gap-2 font-bold tracking-tight text-slate-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            A
          </span>
          Auth Portal
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {subtitle}
        </p>

        <div className="mt-7">{children}</div>

        {footer && (
          <div className="mt-6 text-center text-sm text-slate-500">
            {footer}
          </div>
        )}
      </section>
    </main>
  );
}