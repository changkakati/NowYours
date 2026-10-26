
"use client";

import { useState } from "react";
import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { publicRequest } from "@/lib/auth";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    // Save the form reference before awaiting the API request.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await publicRequest("/auth/register", {
        name,
        email,
        password,
      });

      setSuccess(
        data.message ||
          "Account created successfully. Please check your email to verify your account."
      );

      // Use the saved form reference after the API request.
      formElement.reset();
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Get started with your new account."
      footer={
        <>
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl bg-green-50 p-4 text-sm text-green-800"
          >
            <p className="font-semibold">
              Registration successful!
            </p>

            <p className="mt-1">{success}</p>

            <p className="mt-2">
              Open the verification link in your email to verify
              your account and sign in automatically.
            </p>
          </div>
        )}

        <FormField
          label="Full name"
          name="name"
          placeholder="Your name"
          autoComplete="name"
        />

        <FormField
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
        />

        <SubmitButton loading={loading}>
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
