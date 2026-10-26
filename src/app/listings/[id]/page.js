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
        listing &&
        user &&
        String(user.id) === String(listing.user_id);

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
                process.env.NEXT_PUBLIC_API_URL ||
                "http://localhost:3001/api"
            ).replace(/\/$/, "");

            const response = await fetch(
                `${API_URL}/chat/conversations`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        listingId: listing.id,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not start a conversation."
                );
            }

            const conversation = data.conversation || data;

            if (!conversation.id) {
                throw new Error(
                    "The server did not return a conversation ID."
                );
            }

            router.push(
                `/chat?conversationId=${encodeURIComponent(conversation.id)}`
            );
        } catch (err) {
            setError(
                err.message || "Could not start a conversation."
            );
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
            <main className="min-h-screen bg-gray-50 px-4 py-20 text-center text-gray-500">
                Loading listing...
            </main>
        );
    }

    if (error && !listing) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-20 text-center">
                <p className="text-red-600">{error}</p>

                <Link
                    href="/listings"
                    className="mt-4 inline-block font-semibold text-indigo-600"
                >
                    Back to listings
                </Link>
            </main>
        );
    }

    if (!listing) return null;

    const images = listing.images || [];

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/listings"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                >
                    ← Back to listings
                </Link>

                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
                    >
                        {error}
                    </p>
                )}

                <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Listing images and description */}
                    <section>
                        <div className="overflow-hidden rounded-2xl bg-gray-200">
                            {images.length > 0 ? (
                                <img
                                    src={images[0].url}
                                    alt={listing.title}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                            ) : (
                                <div className="flex aspect-[4/3] items-center justify-center text-gray-500">
                                    No image available
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                {images.slice(1).map((image) => (
                                    <img
                                        key={image.id || image.url}
                                        src={image.url}
                                        alt={listing.title}
                                        className="aspect-square w-full rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Description
                            </h2>

                            <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-600">
                                {listing.description}
                            </p>

                            {listing.desired_exchange && (
                                <div className="mt-6 rounded-xl bg-indigo-50 p-4">
                                    <p className="text-sm font-semibold text-indigo-800">
                                        Looking to exchange for
                                    </p>

                                    <p className="mt-1 text-indigo-700">
                                        {listing.desired_exchange}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Listing information and actions */}
                    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
                            {listing.listing_type}
                        </span>

                        {!isOwner && (
                            <WishlistButton listingId={listing.id} />
                        )}

                        <h1 className="mt-4 text-3xl font-bold text-gray-950">
                            {listing.title}
                        </h1>

                        <p className="mt-4 text-2xl font-bold text-gray-950">
                            {formatPrice(listing)}
                        </p>

                        <div className="mt-6 space-y-4 border-t border-gray-100 pt-5 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium text-gray-900">
                                    {listing.category}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Condition</span>
                                <span className="font-medium capitalize text-gray-900">
                                    {listing.item_condition?.replaceAll("_", " ")}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Location</span>
                                <span className="text-right font-medium text-gray-900">
                                    {[listing.area, listing.city]
                                        .filter(Boolean)
                                        .join(", ")}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Seller</span>
                                <span className="font-medium text-gray-900">
                                    {listing.seller_name || "Marketplace member"}
                                </span>
                            </div>
                        </div>

                        {isOwner ? (
                            <div className="mt-7 space-y-3">
                                <Link
                                    href={`/listings/${listing.id}/edit`}
                                    className="block w-full rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700"
                                >
                                    Edit listing
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                    {deleting ? "Deleting..." : "Delete listing"}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-7 space-y-3">
                                <button
                                    type="button"
                                    onClick={handleChatWithSeller}
                                    disabled={startingChat}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {startingChat ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Opening chat...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
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

                                <p className="text-center text-xs leading-5 text-gray-500">
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
                <main className="min-h-screen bg-gray-50 px-4 py-20 text-center text-gray-500">
                    Loading listing...
                </main>
            }
        >
            <ListingDetailsContent />
        </Suspense>
    );
}