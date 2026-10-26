"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { publicRequest, saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

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
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

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
    </AuthCard>
  );
}