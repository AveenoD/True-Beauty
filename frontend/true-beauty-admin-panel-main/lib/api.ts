import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, "");

  // In local dev, mixing `localhost` and `127.0.0.1` breaks SameSite cookies.
  // Normalize loopback host to the current page hostname when possible.
  try {
    const url = new URL(trimmed);
    const isLoopback =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0";

    if (isLoopback && typeof window !== "undefined") {
      const pageHost = window.location.hostname;
      const pageIsLoopback =
        pageHost === "localhost" || pageHost === "127.0.0.1" || pageHost === "0.0.0.0";
      if (pageIsLoopback && url.hostname !== pageHost) {
        url.hostname = pageHost;
        return url.toString().replace(/\/$/, "");
      }
    }

    // Prefer localhost over 127.0.0.1 for consistency across tools.
    if (isLoopback && url.hostname === "127.0.0.1") {
      url.hostname = "localhost";
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // If it's not a valid absolute URL, return as-is.
  }

  return trimmed;
}

const baseURL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9797"
);

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Access token stored in localStorage (survives hard refresh) + memory for fast access.
// Only used for admin auth. User auth uses separate api instance.
const AT_KEY = "tb_admin_at";
const RT_KEY = "tb_admin_rt";
const SESSION_KEY = "tb_admin_session"; // Tracks if user was ever logged in

/** Persisted copy of admin refresh JWT when UI and API are on different origins (cookie may not attach). */
export function setAdminRefreshToken(token: string | null) {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(RT_KEY, token);
  else localStorage.removeItem(RT_KEY);
}

export function getAdminRefreshToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(RT_KEY);
}

function getStoredAT(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(AT_KEY);
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  // Reset session-expired guard when any new token is set (login, refresh, etc.)
  sessionExpiredDispatched = false;
  if (typeof localStorage !== "undefined") {
    if (token) {
      localStorage.setItem(AT_KEY, token);
      localStorage.setItem(SESSION_KEY, "1"); // Mark user as having had a session
    } else {
      localStorage.removeItem(AT_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(RT_KEY);
    }
  }
}

function restoreAT(): string | null {
  if (accessToken) return accessToken;
  const stored = getStoredAT();
  if (stored) accessToken = stored;
  return accessToken;
}

export function getAccessToken() {
  return accessToken || getStoredAT();
}

// Module-level token in memory (fast, reset on hard refresh — but we restore from localStorage on init)
let accessToken: string | null = null;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const rt = getAdminRefreshToken();
  refreshPromise = api
    .post<{ success: boolean; data: { accessToken: string; refreshToken?: string } }>(
      "/admins/refresh-token",
      rt ? { refreshToken: rt } : {}
    )
    .then((res) => {
      const at = res.data?.data?.accessToken ?? null;
      const nextRt = res.data?.data?.refreshToken;
      accessToken = at;
      if (typeof localStorage !== "undefined") {
        if (at) {
          localStorage.setItem(AT_KEY, at);
          localStorage.setItem(SESSION_KEY, "1");
        } else {
          localStorage.removeItem(AT_KEY);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      if (nextRt) setAdminRefreshToken(nextRt);
      return at;
    })
    .catch(() => {
      accessToken = null;
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(AT_KEY);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(RT_KEY);
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Public helper so non-interceptor code can share the same single-flight refresh.
export function refreshAdminAccessToken() {
  return refreshAccessToken();
}

// Request interceptor - adds Authorization header (restores AT from localStorage if needed)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = restoreAT();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles 401 and auto-refresh
let sessionExpiredDispatched = false;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No config or already retried
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url || "";

    // Skip refresh for auth endpoints (infinite loop prevention)
    if (
      url.includes("/admins/refresh-token") ||
      url.includes("/admins/login") ||
      url.includes("/admins/register")
    ) {
      return Promise.reject(error);
    }

    // 401 - token expired or invalid
    if (error.response?.status === 401) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed (no/invalid RT) — dispatch session-expired only once
      // Only redirect if user had an active session before.
      if (
        !sessionExpiredDispatched &&
        localStorage.getItem(SESSION_KEY)
      ) {
        sessionExpiredDispatched = true;
        localStorage.removeItem(SESSION_KEY);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tb:auth:session-expired"));
        }
      }
    }

    return Promise.reject(error);
  }
);

export type ApiSuccess<T> = { success: boolean; message: string; data: T };