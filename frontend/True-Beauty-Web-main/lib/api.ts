import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:9797";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = api
    .post<{ success: boolean; data: { accessToken: string } }>(
      "/users/refresh-token",
      {}
    )
    .then((res) => {
      const at = res.data?.data?.accessToken;
      accessToken = at ?? null;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!original || original._retry) {
      return Promise.reject(error);
    }
    const url = original.url || "";
    if (
      url.includes("/users/refresh-token") ||
      url.includes("/users/login") ||
      url.includes("/users/register")
    ) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export type ApiSuccess<T> = { success: true; message: string; data: T };
