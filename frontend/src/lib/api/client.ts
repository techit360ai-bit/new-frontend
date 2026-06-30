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
export function setAuthTokenGetter(fn: () => string | null) {
  authTokenGetter = fn;
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = authTokenGetter?.();
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

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "GET",
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    ...init,
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

/**
 * Run an API call, falling back to bundled mock data on failure (unless strict
 * mode is on). Keeps dashboards rendering when the backend is unavailable.
 *
 *   const holdings = await withFallback(() => fetchEquity(), equityHoldings);
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
