import { API_BASE, getAccessToken } from "@/lib/auth";

const API_URL = `${API_BASE}/listings`;

async function request(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const listingsApi = {
  getAll(params = {}) {
    const query = new URLSearchParams(params);
    const suffix = query.size ? `?${query}` : "";
    return request(suffix);
  },

  getMine() {
    return request("/mine");
  },

  getById(id) {
    return request(`/${encodeURIComponent(id)}`);
  },

  create(payload) {
    return request("", {
      method: "POST",
      body: payload,
    });
  },

  update(id, payload) {
    return request(`/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  delete(id) {
    return request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};