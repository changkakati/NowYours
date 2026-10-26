
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AuthCard from "@/components/AuthCard";
import { publicRequest, saveSession } from "@/lib/auth";

function VerificationForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No verification token was found. Please open the verification link from your email."
      );
      setLoading(false);
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;

    async function verifyEmail() {
      try {
        const data = await publicRequest("/auth/verify-email", {
          token,
        });

        const session = data.tokens || data;

        const accessToken =
          session.accessToken || session.access_token;

        const refreshToken =
          session.refreshToken || session.refresh_token;

        if (!accessToken || !refreshToken) {
          throw new Error(
            "Email verification succeeded, but the server did not return login tokens."
          );
        }

        saveSession(data);
        router.replace("/dashboard");
      } catch (err) {
        setError(err.message || "Email verification failed.");
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token, router]);

  return (
    <AuthCard
      title="Verifying your email"
      subtitle="Please wait while we verify your email and sign you in."
    >
      {loading && (
        <div className="py-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">
            Verifying email and signing you in...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
          <a
            href="/login"
            className="mt-3 block font-semibold underline"
          >
            Go to login
          </a>
        </div>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10 text-center">Loading...</main>
      }
    >
      <VerificationForm />
    </Suspense>
  );
}
