// frontend/src/lib/api/client.ts
//
// Tiny typed fetch client for the ai-router backend. No runtime deps (the project
// can't add packages in some environments), just native fetch + a fallback helper.

import { apiUrl, apiFallbackEnabled } from "./config";
import { fetchIdempotent } from '@/lib/resilience/retry';

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
  retryAfterSeconds?: number;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    const retry = typeof body === "object" && body !== null && "retryAfterSeconds" in body
      ? Number((body as { retryAfterSeconds?: unknown }).retryAfterSeconds)
      : NaN;
    if (Number.isFinite(retry) && retry > 0) this.retryAfterSeconds = retry;
  }
}

/** Optional auth token getter — wire to real auth later. */
let authTokenGetter: (() => string | null) | null = null;
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const inFlightGets = new Map<string, Promise<unknown>>();
const etags = new Map<string, string>();
const etagBodies = new Map<string, unknown>();
function sessionValue(key: string) { try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null } catch { return null } }
function csrfToken() { try { const part = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('techit_csrf=')); return part ? decodeURIComponent(part.slice('techit_csrf='.length)) : null } catch { return null } }
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
  const csrf = csrfToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
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
  const url = apiUrl(path);
  const run = () => {
    const requestHeaders = headers(init.headers) as Record<string, string>;
    if (method === 'GET' && etags.has(url)) requestHeaders['If-None-Match'] = etags.get(url)!;
    return fetch(url, { method, ...init, headers: requestHeaders, body: body === undefined ? init.body : JSON.stringify(body), credentials: 'include', signal: timeoutSignal(init) });
  }
  let response = method === 'GET' ? await fetchIdempotent(run) : await run()
  if (response.status === 401 && getAuthToken() && path !== '/auth/refresh' && path !== 'auth/refresh') {
    const token = await refreshAccessToken()
    if (token) response = await run()
  }
  if (method === 'GET' && response.status === 304 && etagBodies.has(url)) return etagBodies.get(url) as T;
  const parsed = await parse<T>(response);
  if (method === 'GET') {
    const etag = response.headers.get('ETag');
    if (etag) {
      etags.set(url, etag);
      etagBodies.set(url, parsed);
    }
  }
  return parsed;
}

export function isCapacityError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 429 || error.status === 503);
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken() || "anonymous";
  const key = `${token}:${path}:${JSON.stringify(init?.headers || {})}`;
  const existing = inFlightGets.get(key);
  if (existing) return existing as Promise<T>;
  const request = requestWithRefresh<T>(path, init || {}, 'GET').finally(() => {
    if (inFlightGets.get(key) === request) inFlightGets.delete(key);
  });
  inFlightGets.set(key, request);
  return request;
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
