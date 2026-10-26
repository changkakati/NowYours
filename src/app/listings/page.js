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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              NowYours Marketplace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Find something useful.
            </h1>

            <p className="mt-2 text-gray-600">
              Buy, exchange, or find something for free in your community.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/listings/mine"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-white"
            >
              My listings
            </Link>

            <Link
              href="/listings/new"
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Create listing
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items..."
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
          >
            <option value="">All listing types</option>
            <option value="sell">For sale</option>
            <option value="exchange">Exchange</option>
            <option value="free">Free</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gray-950 px-4 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Search
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Recent listings
          </h2>

          <span className="text-sm text-gray-500">
            {listings.length} shown
          </span>
        </div>

        {error && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Loading listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No listings found
            </h3>
            <p className="mt-2 text-gray-500">
              Try different filters or be the first to post an item.
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Create a listing
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}