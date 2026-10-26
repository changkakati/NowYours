
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Could not check wishlist.");
        }

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
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/wishlist/${encodeURIComponent(listingId)}`,
        {
          method: saved ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading || checking}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        title={saved ? "Remove from wishlist" : "Add to wishlist"}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-sm transition hover:scale-105 hover:bg-white disabled:opacity-60"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={saved ? "text-red-600" : "text-gray-700"}
            aria-hidden="true"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        )}
      </button>

      {error && (
        <span
          role="alert"
          className="absolute right-0 top-12 z-20 w-48 rounded-lg bg-red-50 p-2 text-xs text-red-700 shadow"
        >
          {error}
        </span>
      )}
    </div>
  );
}
