

"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { upload } from "@vercel/blob/client";

import { API_BASE, getAccessToken } from "@/lib/auth";

import { listingsApi } from "@/lib/listings";

const MAX_IMAGES = 4;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp",

    "image/avif",

];

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

const inputClass =

    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black";

const labelClass = "mb-2 block text-sm font-medium text-gray-800";

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

            router.replace("/login");

        }

    }, [router]);

    useEffect(() => {

        return () => {

            previewUrlsRef.current.forEach((url) => {

                URL.revokeObjectURL(url);

            });

        };

    }, []);

    function updateField(event) {

        const { name, value } = event.target;

        setForm((previous) => ({

            ...previous,

            [name]: value,

        }));

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

            rejectedFiles.push(

                `Only ${remainingSlots} more image(s) can be selected.`

            );

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

        setImages((previous) =>

            previous.filter((image) => image.id !== imageId)

        );

    }

    async function handleSubmit(event) {

        event.preventDefault();

        setError("");

        const token = getAccessToken();

        if (!token) {

            router.push("/login");

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

        if (

            form.listing_type === "exchange" &&

            !desiredExchange

        ) {

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

                    setUploadProgress(

                        `Uploading image ${index + 1} of ${images.length}...`

                    );

                    // The backend expects the JWT in clientPayload and a user-specific path.
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

                result?.listing?.id ??

                result?.data?.listing?.id ??

                result?.id;

            if (listingId) {

                router.push(`/listings/${listingId}`);

            } else {

                router.push("/listings/mine");

            }

            router.refresh();

        } catch (err) {

            setError(

                err?.message ||

                "Unable to create the listing. Please try again."

            );

        } finally {

            setSubmitting(false);

            setUploading(false);

            setUploadProgress("");

        }

    }

    return (

        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">

            <div className="mx-auto max-w-3xl">

                <div className="mb-8">

                    <button

                        type="button"

                        onClick={() => router.back()}

                        className="mb-5 text-sm text-gray-500 transition hover:text-black"

                    >

                        ← Back

                    </button>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">

                        Marketplace

                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">

                        Create a listing

                    </h1>

                    <p className="mt-3 text-sm leading-6 text-gray-600">

                        Give your item a second life. Sell it, exchange it, or give

                        it away for free.

                    </p>

                </div>

                <form

                    onSubmit={handleSubmit}

                    className="space-y-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"

                >

                    {error && (

                        <div

                            role="alert"

                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"

                        >

                            {error}

                        </div>

                    )}

                    <section>

                        <h2 className="mb-4 text-lg font-semibold text-gray-950">

                            What do you want to do?

                        </h2>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                            {[

                                {

                                    value: "sell",

                                    title: "Sell",

                                    description: "Set your asking price",

                                },

                                {

                                    value: "exchange",

                                    title: "Exchange",

                                    description: "Trade for another item",

                                },

                                {

                                    value: "free",

                                    title: "Give away",

                                    description: "Offer it for free",

                                },

                            ].map((option) => (

                                <button

                                    key={option.value}

                                    type="button"

                                    onClick={() =>

                                        setForm((previous) => ({

                                            ...previous,

                                            listing_type: option.value,

                                        }))

                                    }

                                    className={`rounded-xl border p-4 text-left transition ${form.listing_type === option.value

                                        ? "border-black bg-gray-50 ring-1 ring-black"

                                        : "border-gray-200 hover:border-gray-400"

                                        }`}

                                >

                                    <span className="block text-sm font-semibold text-gray-950">

                                        {option.title}

                                    </span>

                                    <span className="mt-1 block text-xs text-gray-500">

                                        {option.description}

                                    </span>

                                </button>

                            ))}

                        </div>

                    </section>

                    <section>

                        <h2 className="mb-4 text-lg font-semibold text-gray-950">

                            Item details

                        </h2>

                        <div className="space-y-5">

                            <div>

                                <label htmlFor="title" className={labelClass}>

                                    Listing title *

                                </label>

                                <input

                                    id="title"

                                    name="title"

                                    value={form.title}

                                    onChange={updateField}

                                    className={inputClass}

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

                                    className={`${inputClass} min-h-32 resize-y`}

                                    placeholder="Describe the item, its features, and anything a buyer should know..."

                                    maxLength={5000}

                                    required

                                />

                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                <div>

                                    <label htmlFor="category" className={labelClass}>

                                        Category *

                                    </label>

                                    <select

                                        id="category"

                                        name="category"

                                        value={form.category}

                                        onChange={updateField}

                                        className={inputClass}

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

                                        className={inputClass}

                                        required

                                    >

                                        {CONDITIONS.map((condition) => (

                                            <option

                                                key={condition.value}

                                                value={condition.value}

                                            >

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

                                        className={inputClass}

                                        placeholder="Enter price in INR"

                                        required

                                    />

                                </div>

                            )}

                            {form.listing_type === "exchange" && (

                                <div>

                                    <label

                                        htmlFor="desired_exchange"

                                        className={labelClass}

                                    >

                                        What would you like in exchange? *

                                    </label>

                                    <textarea

                                        id="desired_exchange"

                                        name="desired_exchange"

                                        value={form.desired_exchange}

                                        onChange={updateField}

                                        className={`${inputClass} min-h-24 resize-y`}

                                        placeholder="e.g. A similar phone or a tablet"

                                        maxLength={1000}

                                        required

                                    />

                                    <p className="mt-2 text-xs text-gray-500">

                                        You can optionally enter an additional price if

                                        you are open to a cash difference.

                                    </p>

                                    <input

                                        aria-label="Optional exchange cash difference in INR"

                                        name="price"

                                        type="number"

                                        min="0"

                                        step="1"

                                        value={form.price}

                                        onChange={updateField}

                                        className={`${inputClass} mt-3`}

                                        placeholder="Optional cash difference (₹)"

                                    />

                                </div>

                            )}

                            {form.listing_type === "free" && (

                                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">

                                    This listing will be offered for free. You do not

                                    need to enter a price.

                                </p>

                            )}

                        </div>

                    </section>

                    <section>

                        <div className="mb-4">

                            <h2 className="text-lg font-semibold text-gray-950">

                                Item photos

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                Select up to four images from your computer. JPEG,

                                PNG, WebP, or AVIF; maximum 5 MB per image.

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

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                            {images.map((image, index) => (

                                <div

                                    key={image.id}

                                    className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"

                                >

                                    <img

                                        src={image.preview}

                                        alt={`Selected item photo ${index + 1}`}

                                        className="h-full w-full object-cover"

                                    />

                                    {index === 0 && (

                                        <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-xs text-white">

                                            First photo

                                        </span>

                                    )}

                                    <button

                                        type="button"

                                        onClick={() => removeImage(image.id)}

                                        aria-label={`Remove image ${index + 1}`}

                                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-black shadow transition hover:bg-red-50"

                                    >

                                        ×

                                    </button>

                                </div>

                            ))}

                            {images.length < MAX_IMAGES && (

                                <button

                                    type="button"

                                    onClick={() => fileInputRef.current?.click()}

                                    className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-black hover:bg-gray-100"

                                >

                                    <span className="text-3xl font-light text-gray-500">

                                        +

                                    </span>

                                    <span className="mt-2 text-sm font-medium text-gray-800">

                                        Add photos

                                    </span>

                                    <span className="mt-1 text-xs text-gray-500">

                                        {images.length}/{MAX_IMAGES}

                                    </span>

                                </button>

                            )}

                        </div>

                        {uploading && (

                            <p className="mt-4 text-sm font-medium text-gray-700">

                                {uploadProgress}

                            </p>

                        )}

                    </section>

                    <section>

                        <h2 className="mb-4 text-lg font-semibold text-gray-950">

                            Location

                        </h2>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            <div>

                                <label htmlFor="city" className={labelClass}>

                                    City *

                                </label>

                                <input

                                    id="city"

                                    name="city"

                                    value={form.city}

                                    onChange={updateField}

                                    className={inputClass}

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

                                    className={inputClass}

                                    placeholder="e.g. Maligaon"

                                    maxLength={150}

                                />

                            </div>

                        </div>

                    </section>

                    <div className="border-t border-gray-100 pt-6">

                        <button

                            type="submit"

                            disabled={submitting}

                            className="flex w-full items-center justify-center rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"

                        >

                            {submitting

                                ? uploading

                                    ? "Uploading photos..."

                                    : "Creating listing..."

                                : "Publish listing"}

                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-gray-500">

                            Please make sure your listing details and photos are

                            accurate before publishing.

                        </p>

                    </div>

                </form>

            </div>

        </main>

    );

}