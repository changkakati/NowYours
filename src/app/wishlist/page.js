
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";
import { getAccessToken } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

function formatPrice(listing) {
  if (listing.listing_type === "free") return "Free";

  if (listing.listing_type === "exchange") {
    return listing.price == null
      ? "Exchange"
      : `Exchange + ₹${Number(listing.price).toLocaleString("en-IN")}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(listing.price || 0));
}

export default function WishlistPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWishlist = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

            return {
              ...listing,
              wishlist_created_at: item.created_at,
            };
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
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/listings"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Browse listings
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Your collection
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Wishlist
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Keep track of items you want to come back to.
            </p>
          </div>

          {!loading && (
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
              {items.length} saved {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={loadWishlist}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-sm text-gray-500">
            Loading your wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                viewBox="0 0 24 24"
                width="27"
                height="27"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Your wishlist is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Save items that catch your eye and they'll be waiting here when
              you return.
            </p>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Explore listings
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative bg-gray-100">
                  <Link href={`/listings/${listing.id}`}>
                    {listing.images?.[0]?.url ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-400">
                        No image available
                      </div>
                    )}
                  </Link>

                  <div className="absolute right-3 top-3">
                    <WishlistButton listingId={listing.id} />
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium capitalize text-indigo-600">
                    {listing.listing_type}
                    {listing.category ? ` · ${listing.category}` : ""}
                  </p>

                  <Link href={`/listings/${listing.id}`}>
                    <h2 className="mt-2 line-clamp-2 font-semibold text-gray-950 hover:underline">
                      {listing.title}
                    </h2>
                  </Link>

                  <p className="mt-3 text-lg font-bold text-gray-950">
                    {formatPrice(listing)}
                  </p>

                  <p className="mt-2 truncate text-xs text-gray-500">
                    {[listing.area, listing.city]
                      .filter(Boolean)
                      .join(", ") || "Location not specified"}
                  </p>

                  <Link
                    href={`/listings/${listing.id}`}
                    className="mt-4 block rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    View listing
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
