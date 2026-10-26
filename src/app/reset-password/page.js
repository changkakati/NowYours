"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(
      form.get("confirmPassword") || ""
    );

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const token = params.get("token");

    if (!token) {
      setError("The password reset token is missing.");
      setLoading(false);
      return;
    }

    try {
      const data = await publicRequest(
        "/auth/reset-password",
        { token, password }
      );

      setMessage(
        data.message || "Password updated successfully."
      );

      window.setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />

        <FormField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />

        <SubmitButton loading={loading}>
          Reset password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10 text-center">
          Loading...
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}