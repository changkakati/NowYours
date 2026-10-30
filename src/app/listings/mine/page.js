"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { listingsApi } from "@/lib/listings";
import { getAccessToken } from "@/lib/auth";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-slate-100 text-slate-600",
  given_away: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-400",
};

function formatStatus(status) {
  return (status || "unknown").replaceAll("_", " ");
}

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }

    async function load() {
      try {
        const data = await listingsApi.getMine();
        setListings(data.listings || []);
      } catch (err) {
        setError(err.message || "Could not load your listings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          ← Browse listings
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              My listings
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Manage the items you've posted.
            </p>
          </div>

          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
          >
            <span className="text-base leading-none">+</span>
            Create listing
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl bg-slate-100"
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="sr-only">Loading your listings…</span>
          </>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-base font-semibold text-slate-900">
              You haven't posted anything yet
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Create your first listing to get started.
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              <span className="text-base leading-none">+</span>
              Create listing
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <div key={listing.id} className="group">
                <ListingCard listing={listing} />

                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                      statusStyles[listing.status] || statusStyles.archived
                    }`}
                  >
                    {formatStatus(listing.status)}
                  </span>

                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="text-sm font-medium text-slate-900 underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}