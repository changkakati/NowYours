export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api";

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(USER_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function saveSession(data) {
  const tokens = data.tokens || data;

  const accessToken =
    tokens.accessToken || tokens.access_token;

  const refreshToken =
    tokens.refreshToken || tokens.refresh_token;

  if (accessToken) {
    localStorage.setItem(ACCESS_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  if (data.user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user)
    );
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

export async function publicRequest(path, body = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

let refreshInProgress = null;

export async function refreshAccessToken() {
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) return false;

    try {
      const response = await fetch(
        `${API_BASE}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken,
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        clearSession();
        return false;
      }

      const data = await response.json();

      saveSession(data);

      const tokens = data.tokens || data;

      return Boolean(
        tokens.accessToken || tokens.access_token
      );
    } catch {
      return false;
    } finally {
      refreshInProgress = null;
    }
  })();

  return refreshInProgress;
}

export async function apiRequest(path, options = {}) {
  const sendRequest = () => {
    const headers = new Headers(options.headers);
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    if (
      options.body &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  };

  let response = await sendRequest();

  if (
    response.status === 401 &&
    path !== "/auth/refresh"
  ) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      response = await sendRequest();
    }
  }

  return parseResponse(response);
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken();

  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({
        refreshToken,
        refresh_token: refreshToken,
      }),
    });
  } finally {
    clearSession();
  }
}