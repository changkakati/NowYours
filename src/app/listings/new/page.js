"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { API_BASE, getAccessToken } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const CATEGORIES = [
  "Electronics",
  "Mobiles",
  "Computers",
  "Fashion",
  "Home & Furniture",
  "Books",
  "Vehicles",
  "Sports & Outdoors",
  "Toys & Games",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for_parts", label: "For parts / repair" },
];

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none " +
  "focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const sectionHeadingClass = "mb-4 text-base font-semibold text-slate-900";

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    listing_type: "sell",
    category: "Electronics",
    item_condition: "good",
    price: "",
    desired_exchange: "",
    city: "",
    area: "",
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleImageSelection(event) {
    setError("");
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError("You can upload a maximum of four images.");
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const rejectedFiles = [];

    const validFiles = filesToAdd.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejectedFiles.push(`${file.name}: unsupported image format`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}: exceeds the 5 MB limit`);
        return false;
      }
      return true;
    });

    if (selectedFiles.length > remainingSlots) {
      rejectedFiles.push(`Only ${remainingSlots} more image(s) can be selected.`);
    }

    if (rejectedFiles.length > 0) {
      setError(rejectedFiles.join(". "));
    }

    const newImages = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrlsRef.current.push(preview);
      return {
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview,
      };
    });

    setImages((previous) => [...previous, ...newImages]);
  }

  function removeImage(imageId) {
    const imageToRemove = images.find((image) => image.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
      previewUrlsRef.current = previewUrlsRef.current.filter(
        (url) => url !== imageToRemove.preview
      );
    }
    setImages((previous) => previous.filter((image) => image.id !== imageId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const city = form.city.trim();
    const area = form.area.trim();
    const desiredExchange = form.desired_exchange.trim();

    if (!title || !description || !city) {
      setError("Please complete the title, description, and city fields.");
      return;
    }

    if (form.listing_type === "sell" && Number(form.price) <= 0) {
      setError("Enter a price greater than zero.");
      return;
    }

    if (form.listing_type === "exchange" && !desiredExchange) {
      setError("Describe what you would like to exchange for.");
      return;
    }

    setSubmitting(true);

    try {
      let uploadedImages = [];

      if (images.length > 0) {
        setUploading(true);

        for (let index = 0; index < images.length; index++) {
          const image = images[index];
          const safeName = image.file.name
            .replace(/[^a-zA-Z0-9.\_-]/g, "-")
            .slice(-100);

          setUploadProgress(`Uploading image ${index + 1} of ${images.length}…`);

          const tokenParts = token.split(".");
          if (tokenParts.length !== 3) {
            throw new Error("Invalid access token. Please log in again.");
          }

          const encodedPayload = tokenParts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const paddedPayload = encodedPayload.padEnd(
            encodedPayload.length + ((4 - (encodedPayload.length % 4)) % 4),
            "="
          );
          const tokenPayload = JSON.parse(atob(paddedPayload));
          const userId = tokenPayload.sub;

          if (typeof userId !== "string" || !userId) {
            throw new Error(
              "Unable to identify your account. Please log in again."
            );
          }

          const blob = await upload(
            `marketplace/${userId}/${Date.now()}-${safeName}`,
            image.file,
            {
              access: "public",
              handleUploadUrl: `${API_BASE}/listings/upload`,
              clientPayload: token,
              contentType: image.file.type,
            }
          );

          uploadedImages.push({ url: blob.url });
        }

        setUploading(false);
        setUploadProgress("");
      }

      const payload = {
        title,
        description,
        listing_type: form.listing_type,
        category: form.category,
        item_condition: form.item_condition,
        city,
        area: area || null,
        images: uploadedImages,
      };

      if (form.listing_type === "sell") {
        payload.price = Number(form.price);
        payload.desired_exchange = null;
      } else if (form.listing_type === "exchange") {
        payload.price = form.price ? Number(form.price) : null;
        payload.desired_exchange = desiredExchange;
      } else {
        payload.price = null;
        payload.desired_exchange = null;
      }

      const result = await listingsApi.create(payload);
      const listingId =
        result?.listing?.id ?? result?.data?.listing?.id ?? result?.id;

      if (listingId) {
        router.push(`/listings/${listingId}`);
      } else {
        router.push("/listings/mine");
      }

      router.refresh();
    } catch (err) {
      setError(
        err?.message || "Unable to create the listing. Please try again."
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
        >
          ← Back
        </button>

        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Marketplace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Create a listing
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Give your item a second life. Sell it, exchange it, or give it away
          for free.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Type selector */}
          <section>
            <h2 className={sectionHeadingClass}>What do you want to do?</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { value: "sell", title: "Sell", description: "Set your asking price" },
                { value: "exchange", title: "Exchange", description: "Trade for another item" },
                { value: "free", title: "Give away", description: "Offer it for free" },
              ].map((option) => {
                const selected = form.listing_type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        listing_type: option.value,
                      }))
                    }
                    className={`rounded-lg border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                      selected
                        ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/60"
                    }`}
                  >
                    <span className="block text-sm font-medium text-slate-900">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Item details */}
          <section>
            <h2 className={sectionHeadingClass}>Item details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Listing title *
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  className={fieldClass}
                  placeholder="e.g. Samsung Galaxy S23"
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  className={`${fieldClass} min-h-32 resize-y`}
                  placeholder="Describe the item, its features, and anything a buyer should know…"
                  maxLength={5000}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className={labelClass}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className={fieldClass}
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="item_condition" className={labelClass}>
                    Condition *
                  </label>
                  <select
                    id="item_condition"
                    name="item_condition"
                    value={form.item_condition}
                    onChange={updateField}
                    className={fieldClass}
                    required
                  >
                    {CONDITIONS.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.listing_type === "sell" && (
                <div>
                  <label htmlFor="price" className={labelClass}>
                    Asking price (₹) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={updateField}
                    className={fieldClass}
                    placeholder="Enter price in INR"
                    required
                  />
                </div>
              )}

              {form.listing_type === "exchange" && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="desired_exchange" className={labelClass}>
                      What would you like in exchange? *
                    </label>
                    <textarea
                      id="desired_exchange"
                      name="desired_exchange"
                      value={form.desired_exchange}
                      onChange={updateField}
                      className={`${fieldClass} min-h-24 resize-y`}
                      placeholder="e.g. A similar phone or a tablet"
                      maxLength={1000}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="exchange_price" className={labelClass}>
                      Optional cash difference (₹)
                    </label>
                    <input
                      id="exchange_price"
                      name="price"
                      type="number"
                      min="0"
                      step="1"
                      value={form.price}
                      onChange={updateField}
                      className={fieldClass}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {form.listing_type === "free" && (
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  This listing will be offered for free. You don&apos;t need to enter a price.
                </p>
              )}
            </div>
          </section>

          {/* Photos */}
          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">
                Item photos
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Up to 4 images. JPEG, PNG, WebP or AVIF. Max 5 MB each.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleImageSelection}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <img
                    src={image.preview}
                    alt={`Selected item photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove image ${index + 1}`}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center transition hover:border-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                >
                  <span className="text-2xl font-light leading-none text-slate-400">
                    +
                  </span>
                  <span className="mt-1.5 text-xs font-medium text-slate-700">
                    Add photos
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </button>
              )}
            </div>

            {uploading && (
              <p className="mt-3 text-sm font-medium text-slate-700">
                {uploadProgress}
              </p>
            )}
          </section>

          {/* Location */}
          <section>
            <h2 className={sectionHeadingClass}>Location</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  className={fieldClass}
                  placeholder="e.g. Guwahati"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="area" className={labelClass}>
                  Area / neighbourhood
                </label>
                <input
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={updateField}
                  className={fieldClass}
                  placeholder="e.g. Maligaon"
                  maxLength={150}
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 active:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
            >
              {submitting ? (
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
                  {uploading ? "Uploading photos…" : "Creating listing…"}
                </>
              ) : (
                "Publish listing"
              )}
            </button>

            <p className="mt-2.5 text-center text-xs text-slate-500">
              Please make sure your listing details and photos are accurate
              before publishing.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}