"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  apiRequest,
  clearSession,
  getStoredUser,
  logoutRequest,
} from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadUser = useCallback(async () => {
    const cachedUser = getStoredUser();
    const accessToken = localStorage.getItem("auth_access_token");

    if (!cachedUser && !accessToken) {
      router.replace("/auth/login");
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
    }

    try {
      const data = await apiRequest("/auth/me", { method: "GET" });
      const currentUser = data.user || data;

      setUser(currentUser);
      localStorage.setItem("auth_user", JSON.stringify(currentUser));
    } catch (error) {
      clearSession();
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } finally {
      clearSession();
      router.replace("/auth/login");
    }
  }

  const emailVerified =
    user?.is_email_verified === true ||
    user?.is_email_verified === 1 ||
    user?.is_email_verified === "1" ||
    user?.emailVerified === true ||
    user?.email_verified === true ||
    user?.email_verified === 1 ||
    user?.email_verified === "1";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-end  px-4 py-3.5 sm:px-6">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className=" 
              rounded-lg border border-slate-200 px-3.5 py-2
              text-sm font-medium text-slate-700
              transition hover:bg-slate-50
              disabled:cursor-not-allowed disabled:opacity-60
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2
            "
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Overview
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          You're signed in. Here's your account overview.
        </p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-100"
                aria-hidden="true"
              />
            ))}
            <span className="sr-only">Loading your account…</span>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Account card */}
            <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-sm text-slate-500">Signed in as</p>

              <h2 className="mt-2 truncate text-lg font-semibold text-slate-900">
                {user?.name || "Account holder"}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {user?.email || "No email returned"}
              </p>
            </article>

            {/* Verification card */}
            <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-sm text-slate-500">Email verification</p>

              <p
                className={`mt-2 inline-flex items-center gap-1.5 text-lg font-semibold ${
                  emailVerified ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    emailVerified ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  aria-hidden="true"
                />
                {emailVerified ? "Verified" : "Not confirmed"}
              </p>

              {!emailVerified && (
                <a
                  href="/verify-email"
                  className="mt-3 inline-block text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                >
                  Verify your email →
                </a>
              )}
            </article>
          </div>
        )}
      </section>
    </main>
  );
}