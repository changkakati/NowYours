
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";

import { publicRequest, saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setLoading(true);
    setError("");

    try {
      const data = await publicRequest("/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });

      saveSession(data);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setLoading(true);
    setError("");

    try {
      const data = await publicRequest("/auth/google", {
        credential,
      });

      saveSession(data);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to your account."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            className="font-semibold text-indigo-600"
            href="/register"
          >
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          onError={setError}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-slate-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <div>
            <div className="mb-1.5 flex justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <SubmitButton loading={loading}>
            Sign in
          </SubmitButton>
        </form>
      </div>
    </AuthCard>
  );
}
