"use client";

import Link from "next/link";
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

export default function ListingCard({ listing, showWishlist = true }) {
  const image = listing.cover_image || listing.images?.[0]?.url || null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/5">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link
          href={`/listings/${listing.id}`}
          aria-label={listing.title}
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-inset"
        >
          {image ? (
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image available
            </div>
          )}
        </Link>

        {showWishlist && (
          <div className="absolute right-2 top-2 z-10">
            <WishlistButton listingId={listing.id} />
          </div>
        )}
      </div>

      {/* Content */}
      <Link
        href={`/listings/${listing.id}`}
        className="block p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-inset"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 text-sm font-medium text-slate-900 ">
            {listing.title}
          </h2>

          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
            {listing.listing_type}
          </span>
        </div>

        <p className="mt-2 text-base font-semibold text-slate-900">
          {formatPrice(listing)}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">
          {[listing.area, listing.city].filter(Boolean).join(", ") ||
            "Location not specified"}
        </p>

        {listing.category && (
          <p className="mt-0.5 text-xs text-slate-400">{listing.category}</p>
        )}
      </Link>
    </div>
  );
}