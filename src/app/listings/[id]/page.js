"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { listingsApi } from "@/lib/listings";
import { getStoredUser } from "@/lib/auth";
import WishlistButton from "@/components/WishlistButton";

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

function ListingDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getStoredUser());

    async function loadListing() {
      try {
        const data = await listingsApi.getById(id);
        setListing(data.listing);
      } catch (err) {
        setError(err.message || "Could not load this listing.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadListing();
  }, [id]);

  const isOwner =
    listing && user && String(user.id) === String(listing.user_id);

  async function handleChatWithSeller() {
    if (startingChat) return;
    setStartingChat(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_access_token");

      if (!token) {
        setError(
          "Your login session could not be found. Please check your authentication session."
        );
        return;
      }

      if (isOwner) {
        setError("You cannot start a conversation with yourself.");
        return;
      }

      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      ).replace(/\/$/, "");

      const response = await fetch(`${API_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not start a conversation.");
      }

      const conversation = data.conversation || data;

      if (!conversation.id) {
        throw new Error("The server did not return a conversation ID.");
      }

      router.push(
        `/chat?conversationId=${encodeURIComponent(conversation.id)}`
      );
    } catch (err) {
      setError(err.message || "Could not start a conversation.");
    } finally {
      setStartingChat(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await listingsApi.delete(id);
      router.replace("/listings/mine");
    } catch (err) {
      setError(err.message || "Could not delete listing.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
        <span className="sr-only">Loading listing…</span>
      </main>
    );
  }

  if (error && !listing) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/listings"
          className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          Back to listings
        </Link>
      </main>
    );
  }

  if (!listing) return null;

  const images = listing.images || [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          ← Back to listings
        </Link>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          {/* Images + description */}
          <section>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {images.length > 0 ? (
                <img
                  src={images[0].url}
                  alt={listing.title}
                  className="aspect-[4/3] w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">
                  No image available
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {images.slice(1).map((image) => (
                  <img
                    key={image.id || image.url}
                    src={image.url}
                    alt={listing.title}
                    className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {listing.description}
              </p>

              {listing.desired_exchange && (
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Looking to exchange for
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {listing.desired_exchange}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Info + actions */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                {listing.listing_type}
              </span>

              {!isOwner && <WishlistButton listingId={listing.id} />}
            </div>

            <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {listing.title}
            </h1>

            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatPrice(listing)}
            </p>

            <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd className="text-right font-medium text-slate-900">
                  {listing.category}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Condition</dt>
                <dd className="text-right font-medium capitalize text-slate-900">
                  {listing.item_condition?.replaceAll("_", " ")}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-right font-medium text-slate-900">
                  {[listing.area, listing.city].filter(Boolean).join(", ")}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Seller</dt>
                <dd className="text-right font-medium text-slate-900">
                  {listing.seller_name || "Marketplace member"}
                </dd>
              </div>
            </dl>

            {isOwner ? (
              <div className="mt-6 space-y-2.5">
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
                >
                  Edit listing
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  {deleting ? "Deleting…" : "Delete listing"}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleChatWithSeller}
                  disabled={startingChat}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
                >
                  {startingChat ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                      Opening chat…
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                      </svg>
                      Chat with seller
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-relaxed text-slate-500">
                  Have a question about this listing? Start a private
                  conversation with the seller.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ListingDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </main>
      }
    >
      <ListingDetailsContent />
    </Suspense>
  );
}