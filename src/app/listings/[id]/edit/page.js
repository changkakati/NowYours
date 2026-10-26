"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";

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
      router.replace("/login");
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
          (listing.images || [])
            .map((image) => image.url)
            .join("\n")
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
      <main className="min-h-screen bg-gray-50 px-4 py-20 text-center text-gray-500">
        Loading listing...
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-20 text-center">
        <p role="alert" className="text-red-600">
          {error || "Listing not found."}
        </p>
        <Link href="/listings/mine" className="mt-4 inline-block text-indigo-600">
          Back to my listings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/listings/${id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to listing
        </Link>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-gray-950">
            Edit listing
          </h1>

          {error && (
            <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="listing_type" className="mb-2 block text-sm font-semibold text-gray-700">
                  Listing type
                </label>
                <select
                  id="listing_type"
                  name="listing_type"
                  value={form.listing_type}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <option value="sell">For sale</option>
                  <option value="exchange">Exchange</option>
                  <option value="free">Give away for free</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  required
                  value={form.category}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>

              <div>
                <label htmlFor="item_condition" className="mb-2 block text-sm font-semibold text-gray-700">
                  Condition
                </label>
                <select
                  id="item_condition"
                  name="item_condition"
                  value={form.item_condition}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like new</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              <div>
                <label htmlFor="price" className="mb-2 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 disabled:bg-gray-100"
                />
              </div>
            </div>

            {form.listing_type === "exchange" && (
              <div>
                <label htmlFor="desired_exchange" className="mb-2 block text-sm font-semibold text-gray-700">
                  Desired exchange
                </label>
                <input
                  id="desired_exchange"
                  name="desired_exchange"
                  required
                  value={form.desired_exchange}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="mb-2 block text-sm font-semibold text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  value={form.city}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>

              <div>
                <label htmlFor="area" className="mb-2 block text-sm font-semibold text-gray-700">
                  Area
                </label>
                <input
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={change}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-semibold text-gray-700">
                Listing status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={change}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="given_away">Given away</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="images" className="mb-2 block text-sm font-semibold text-gray-700">
                Image URLs
              </label>
              <textarea
                id="images"
                rows={4}
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                placeholder="One public image URL per line"
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
              />
              <p className="mt-2 text-xs text-gray-500">
                Submitting this form replaces the listing's current images.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>
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
        <main className="min-h-screen bg-gray-50 px-4 py-20 text-center text-gray-500">
          Loading editor...
        </main>
      }
    >
      <EditListingForm />
    </Suspense>
  );
}