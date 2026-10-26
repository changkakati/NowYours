"use client";

import Link from "next/link";

function formatPrice(listing) {
  if (listing.listing_type === "free") return "Free";
  if (listing.listing_type === "exchange") return "Exchange";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(listing.price || 0));
}

export default function ListingCard({ listing }) {
  const image =
    listing.cover_image ||
    listing.images?.[0]?.url ||
    null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 font-semibold text-gray-900">
            {listing.title}
          </h2>

          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs capitalize text-gray-600">
            {listing.listing_type}
          </span>
        </div>

        <p className="text-lg font-bold text-gray-950">
          {formatPrice(listing)}
        </p>

        <p className="text-sm text-gray-500">
          {listing.area ? `${listing.area}, ` : ""}
          {listing.city}
        </p>

        {listing.category && (
          <p className="text-xs text-gray-400">
            {listing.category}
          </p>
        )}
      </div>
    </Link>
  );
}