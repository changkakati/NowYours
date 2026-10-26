
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";

import { publicRequest, saveSession } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

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

      formElement.reset();
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
      const data = await publicRequest("/auth/google", {
        credential,
      });

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
      <div className="space-y-5">
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
              Or register with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </AuthCard>
  );
}
