// frontend/src/lib/api/client.ts
//
// Tiny typed fetch client for the ai-router backend. No runtime deps (the project
// can't add packages in some environments), just native fetch + a fallback helper.

import { apiUrl, apiFallbackEnabled } from "./config";

const env =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};

// Default per-request timeout. Raw fetch() has none — a slow ai-router or a
// hung network drops the whole UI into a loading-forever state with no
// cancellation on unmount. AbortSignal.timeout fires AbortError after the
// budget; withFallback below logs it cleanly. 30s is generous enough for
// the slower agent endpoints (incubation pipeline, document generation)
// while still bounding the wait. Override with VITE_API_TIMEOUT_MS.
const DEFAULT_TIMEOUT_MS = Number(
  env.VITE_API_TIMEOUT_MS ?? "30000",
) || 30_000;

function timeoutSignal(init?: RequestInit): AbortSignal {
  // Caller-supplied signal wins: the component owns its own cancellation
  // (e.g. on unmount or route change).
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Optional auth token getter — wire to real auth later. */
let authTokenGetter: (() => string | null) | null = null;
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
function sessionValue(key: string) { try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null } catch { return null } }
function setSessionValue(key: string, value: string | null) { try { if (typeof sessionStorage !== 'undefined') { if (value) sessionStorage.setItem(key, value); else sessionStorage.removeItem(key) } } catch {} }
export function setAuthTokenGetter(fn: () => string | null) {
  authTokenGetter = fn;
}

export function setAccessToken(token: string | null) { accessToken = token; setSessionValue('techit_access_token', token); }

export function getAuthToken(): string | null {
  return accessToken ?? authTokenGetter?.() ?? sessionValue('techit_access_token') ?? (import.meta.env.MODE === 'test' ? (() => { try { return localStorage.getItem('techit_token') } catch { return null } })() : null);
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try { if (typeof localStorage !== 'undefined' && localStorage.getItem('techit-data-saver') === '1') h['X-TechIT-Data-Saver'] = '1'; } catch { /* storage unavailable */ }
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, data);
  }
  return data as T;
}

async function requestWithRefresh<T>(path: string, init: RequestInit, method: string, body?: unknown): Promise<T> {
  const run = () => fetch(apiUrl(path), { method, ...init, headers: headers(init.headers), body: body === undefined ? init.body : JSON.stringify(body), credentials: 'include', signal: timeoutSignal(init) })
  let response = await run()
  if (response.status === 401 && getAuthToken() && path !== '/auth/refresh' && path !== 'auth/refresh') {
    const token = await refreshAccessToken()
    if (token) response = await run()
  }
  return parse<T>(response)
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return requestWithRefresh<T>(path, init || {}, 'GET')
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return requestWithRefresh<T>(path, init || {}, 'POST', body)
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return requestWithRefresh<T>(path, init || {}, 'PATCH', body)
}

export async function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return requestWithRefresh<T>(path, init || {}, 'PUT', body)
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return requestWithRefresh<T>(path, init || {}, 'DELETE')
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
    .then(async response => { if (!response.ok) return null; const data = await response.json() as { token?: string }; setAccessToken(data.token || null); return data.token || null })
    .catch(() => null)
    .finally(() => { refreshPromise = null });
  return refreshPromise;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const url = apiUrl(path);
  const h: Record<string, string> = {};
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: h,
    body: formData,
    signal: AbortSignal.timeout(60000),
  });
  return parse<T>(res);
}

/**
 * Run an API call, falling back to bundled mock data on failure (unless strict
 * mode is on). Keeps dashboards rendering when the backend is unavailable.
 *
 *   const data = await withFallback(() => fetchOptionalTelemetry(), { events: [] });
 */
export async function withFallback<T>(
  call: () => Promise<T>,
  fallback: T | (() => T),
  label?: string,
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (!apiFallbackEnabled()) throw err;
    if (typeof console !== "undefined") {
      // Distinguish timeouts so ops doesn't chase a phantom 5xx.
      const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
      const tag = isTimeout ? "[api timeout]" : "[api]";
      console.warn(`${tag} ${label ?? "request"} failed; using mock fallback`, err);
    }
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}
