"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";

import { publicRequest, saveSession } from "@/lib/auth";

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(event) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const pw = String(form.get("password") || "");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await publicRequest("/auth/register", {
        name,
        email,
        password: pw,
      });

      setSuccess(
        data.message ||
          "Account created successfully. Please check your email to verify your account."
      );

      formElement.reset();
      setPassword("");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await publicRequest("/auth/google", { credential });
      saveSession(data);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Google registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join and start selling for free."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="rounded font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 animate-in slide-in-from-top-1 fade-in"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 animate-in slide-in-from-top-1 fade-in"
          >
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Registration successful!
            </div>
            <p className="mt-1.5">{success}</p>
            <p className="mt-2 text-emerald-800/90">
              Open the verification link in your email to verify your account
              and sign in automatically.
            </p>
          </div>
        )}

        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          onError={setError}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--auth-card-bg,#fff)] px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Full name"
            name="name"
            placeholder="John Doe"
            autoComplete="name"
          />

          <FormField
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />

            {password.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 1, 2, 3].map((i) => {
                  const active = i < strength;
                  const color =
                    strength <= 1
                      ? "bg-red-400"
                      : strength === 2
                      ? "bg-amber-400"
                      : strength === 3
                      ? "bg-lime-500"
                      : "bg-emerald-500";
                  return (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        active ? color : "bg-slate-200"
                      }`}
                    />
                  );
                })}
                <span className="ml-1 w-14 text-right text-xs text-slate-500">
                  {["Weak", "Weak", "Fair", "Good", "Strong"][strength]}
                </span>
              </div>
            )}
          </div>

          <SubmitButton loading={loading}>Create account</SubmitButton>

          <p className="text-center text-xs leading-relaxed text-slate-500">
            By creating an account you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-slate-700 underline-offset-2 hover:underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-slate-700 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </AuthCard>
  );
}