"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { listingsApi } from "@/lib/listings";
import { getAccessToken } from "@/lib/auth";

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/listings"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Browse listings
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-950">
              My listings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage the items you have posted.
            </p>
          </div>

          <Link
            href="/listings/new"
            className="inline-flex justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            + Create listing
          </Link>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-20 text-center text-gray-500">
            Loading your listings...
          </p>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              You haven't posted anything yet
            </h2>
            <p className="mt-2 text-gray-500">
              Create your first listing to get started.
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
            >
              Create listing
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <div key={listing.id}>
                <ListingCard listing={listing} />

                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-xs capitalize text-gray-500">
                    Status: {listing.status}
                  </span>

                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
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