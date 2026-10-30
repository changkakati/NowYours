"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { publicRequest } from "@/lib/auth";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const token = params.get("token");

    if (!token) {
      setError("The password reset link is invalid or missing a token.");
      setLoading(false);
      return;
    }

    try {
      const data = await publicRequest("/auth/reset-password", {
        token,
        password,
      });

      setMessage(data.message || "Your password has been updated.");
      setDone(true);

      // Give the user a beat to read, then move to login
      window.setTimeout(() => {
        router.replace("/auth/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Unable to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  // Success screen — cleaner than redirecting from a form
  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="You can now sign in with your new password."
        footer={
          <Link
            href="/auth/login"
            className="font-medium text-slate-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
          >
            Go to sign in
          </Link>
        }
      >
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          {message}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Redirecting you to sign in…
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footer={
        <Link
          href="/auth/login"
          className="font-medium text-slate-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <FormField
          label="New password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <FormField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        <SubmitButton loading={loading}>Reset password</SubmitButton>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4">
          <div
            aria-hidden="true"
            className="w-full max-w-sm space-y-4"
          >
            <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}