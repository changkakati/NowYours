"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { getAccessToken } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

export default function WishlistPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWishlist = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/auth/login");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not load wishlist.");
      }

      const savedItems = data.items || [];

      const results = await Promise.all(
        savedItems.map(async (item) => {
          try {
            const result = await listingsApi.getById(item.listing_id);
            const listing = result.listing;
            if (!listing) return null;
            return { ...listing, wishlist_created_at: item.created_at };
          } catch {
            return null;
          }
        })
      );

      setItems(results.filter(Boolean));
    } catch (err) {
      setError(err.message || "Could not load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          ← Browse listings
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Your collection
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Wishlist
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Keep track of items you want to come back to.
            </p>
          </div>

          {!loading && (
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              {items.length} saved {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={loadWishlist}
              className="shrink-0 font-medium underline underline-offset-2 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:rounded"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-slate-100"
                aria-hidden="true"
              />
            ))}
            <span className="sr-only">Loading your wishlist…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="text-slate-400"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
              Save items that catch your eye and they&apos;ll be waiting here
              when you return.
            </p>

            <Link
              href="/listings"
              className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              Explore listings
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}