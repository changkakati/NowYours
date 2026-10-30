"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

export default function WishlistButton({
  listingId,
  className = "",
  size = "md", // "sm" | "md"
  variant = "light", // "light" | "solid"
}) {
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSaved() {
      const token = getAccessToken();

      if (!token || !listingId) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/wishlist/${encodeURIComponent(listingId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (!response.ok) throw new Error("Could not check wishlist.");

        const data = await response.json();
        if (!cancelled) setSaved(Boolean(data.saved));
      } catch {
        // Do not block browsing if the status check fails.
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkSaved();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function toggleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/wishlist/${encodeURIComponent(listingId)}`,
        {
          method: saved ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not update wishlist.");
      }

      setSaved(Boolean(data.saved));
    } catch (err) {
      setError(err.message || "Could not update wishlist.");
    } finally {
      setLoading(false);
    }
  }

  // Size tokens
  const dim =
    size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? 16 : 18;

  // Variant tokens
  const baseClasses =
    "flex items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses =
    variant === "solid"
      ? "border-transparent bg-slate-900 text-white hover:bg-slate-800"
      : "border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/5 hover:bg-slate-50 hover:border-slate-300";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading || checking}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        title={saved ? "Remove from wishlist" : "Add to wishlist"}
        className={`${baseClasses} ${variantClasses} ${dim}`}
      >
        {loading ? (
          <svg
            className="animate-spin"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width={iconSize}
            height={iconSize}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              saved
                ? "text-rose-600"
                : variant === "solid"
                ? "text-white"
                : "text-slate-700"
            }
            aria-hidden="true"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        )}
      </button>

      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700 shadow-sm"
        >
          {error}
        </span>
      )}
    </div>
  );
}