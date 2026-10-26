"use client";

import { useState } from "react";
import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { publicRequest } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const data = await publicRequest(
        "/auth/forgot-password",
        { email: form.get("email") }
      );

      setMessage(
        data.message ||
          "If the account exists, reset instructions have been sent."
      );
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email to request a password reset."
      footer={
        <Link
          href="/login"
          className="font-semibold text-indigo-600"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {message && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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

        <SubmitButton loading={loading}>
          Send reset link
        </SubmitButton>
      </form>
    </AuthCard>
  );
}