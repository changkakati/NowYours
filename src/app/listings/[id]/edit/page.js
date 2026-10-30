"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none " +
  "focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function EditListingForm() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [form, setForm] = useState(null);
  const [imagesText, setImagesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }

    async function load() {
      try {
        const data = await listingsApi.getById(id);
        const listing = data.listing;

        setForm({
          title: listing.title || "",
          description: listing.description || "",
          listing_type: listing.listing_type || "sell",
          category: listing.category || "",
          item_condition: listing.item_condition || "good",
          price: listing.price ?? "",
          desired_exchange: listing.desired_exchange || "",
          city: listing.city || "",
          area: listing.area || "",
          status: listing.status || "active",
        });

        setImagesText(
          (listing.images || []).map((image) => image.url).join("\n")
        );
      } catch (err) {
        setError(err.message || "Could not load listing.");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id, router]);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const images = imagesText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ url }));

    const payload = {
      ...form,
      price:
        form.listing_type === "free" || form.price === ""
          ? null
          : Number(form.price),
      images,
    };

    if (form.listing_type !== "exchange") {
      payload.desired_exchange = null;
    }

    try {
      await listingsApi.update(id, payload);
      router.push(`/listings/${id}`);
    } catch (err) {
      setError(err.message || "Could not update listing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Loading editor…</span>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20 text-center">
        <p role="alert" className="text-sm text-red-600">
          {error || "Listing not found."}
        </p>
        <Link
          href="/listings/mine"
          className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          Back to my listings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={`/listings/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          ← Back to listing
        </Link>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Edit listing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update the details and save your changes.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className={labelClass}>
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={120}
                value={form.title}
                onChange={change}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={form.description}
                onChange={change}
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="listing_type" className={labelClass}>
                  Listing type
                </label>
                <select
                  id="listing_type"
                  name="listing_type"
                  value={form.listing_type}
                  onChange={change}
                  className={fieldClass}
                >
                  <option value="sell">For sale</option>
                  <option value="exchange">Exchange</option>
                  <option value="free">Give away for free</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  required
                  value={form.category}
                  onChange={change}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="item_condition" className={labelClass}>
                  Condition
                </label>
                <select
                  id="item_condition"
                  name="item_condition"
                  value={form.item_condition}
                  onChange={change}
                  className={fieldClass}
                >
                  <option value="new">New</option>
                  <option value="like_new">Like new</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              <div>
                <label htmlFor="price" className={labelClass}>
                  Price (₹)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  disabled={form.listing_type === "free"}
                  value={form.listing_type === "free" ? "" : form.price}
                  onChange={change}
                  required={form.listing_type === "sell"}
                  placeholder={form.listing_type === "free" ? "Free" : "Price"}
                  className={fieldClass}
                />
              </div>
            </div>

            {form.listing_type === "exchange" && (
              <div>
                <label htmlFor="desired_exchange" className={labelClass}>
                  Desired exchange
                </label>
                <input
                  id="desired_exchange"
                  name="desired_exchange"
                  required
                  value={form.desired_exchange}
                  onChange={change}
                  className={fieldClass}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  value={form.city}
                  onChange={change}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="area" className={labelClass}>
                  Area
                </label>
                <input
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={change}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>
                Listing status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={change}
                className={fieldClass}
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="given_away">Given away</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="images" className={labelClass}>
                Image URLs
              </label>
              <textarea
                id="images"
                rows={4}
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                placeholder="One public image URL per line"
                className={`${fieldClass} font-mono text-xs`}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Submitting this form replaces the listing's current images.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link
                href={`/listings/${id}`}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
              >
                {saving ? (
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
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function EditListingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            </div>
          </div>
        </main>
      }
    >
      <EditListingForm />
    </Suspense>
  );
}