
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      const data = await apiRequest("/auth/me", {
        method: "GET",
      });

      const currentUser = data.user || data;

      setUser(currentUser);

      localStorage.setItem(
        "auth_user",
        JSON.stringify(currentUser)
      );
    } catch (error) {
      clearSession();
      router.replace("/login");
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
      router.replace("/login");
    }
  }

  // Support the field names returned by the backend.
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 font-bold text-white">
              A
            </span>

            <span className="font-bold">Auth Portal</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-medium text-indigo-600">
          OVERVIEW
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          You are signed in. Here is your account overview.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">
            Loading your account...
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Signed in as
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {user?.name || "Account holder"}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {user?.email || "No email returned"}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Email verification
              </p>

              <p
                className={`mt-2 text-xl font-semibold ${
                  emailVerified
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {emailVerified ? "Verified" : "Not confirmed"}
              </p>

              {!emailVerified && (
                <a
                  href="/verify-email"
                  className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
                >
                  Verify your email
                </a>
              )}
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
