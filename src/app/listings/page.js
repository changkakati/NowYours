"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { listingsApi } from "@/lib/listings";

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListings = useCallback(async (filters = {}) => {
    setLoading(true);
    setError("");

    try {
      const data = await listingsApi.getAll({
        page: "1",
        limit: "24",
        ...filters,
      });

      setListings(data.listings || []);
    } catch (err) {
      setError(err.message || "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  function handleSearch(event) {
    event.preventDefault();

    const filters = {
      search: search.trim(),
      city: city.trim(),
      category: category.trim(),
      listing_type: type,
    };

    Object.keys(filters).forEach((key) => {
      if (!filters[key]) delete filters[key];
    });

    loadListings(filters);
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setCategory("");
    setType("");
    loadListings();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 " +
    "placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none " +
    "focus:ring-1 focus:ring-slate-900";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              NowYours Marketplace
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Find something useful.
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Buy, exchange, or find something for free in your community.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/listings/mine"
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              My listings
            </Link>

            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              <span className="text-base leading-none">+</span>
              Create listing
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <form
          onSubmit={handleSearch}
          className="mt-6 grid gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className={inputClass}
            aria-label="Search items"
          />

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className={inputClass}
            aria-label="City"
          />

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className={inputClass}
            aria-label="Category"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${inputClass} bg-white`}
            aria-label="Listing type"
          >
            <option value="">All types</option>
            <option value="sell">For sale</option>
            <option value="exchange">Exchange</option>
            <option value="free">Free</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              Search
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              aria-label="Clear filters"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Section header */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Recent listings
          </h2>

          <span className="text-xs text-slate-400 sm:text-sm">
            {listings.length} shown
          </span>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-slate-100"
                aria-hidden="true"
              />
            ))}
            <span className="sr-only">Loading listings…</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              No listings found
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Try different filters or be the first to post an item.
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              Create a listing
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}