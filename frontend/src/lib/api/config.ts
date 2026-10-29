// frontend/src/lib/api/config.ts
//
// Central config for talking to the ai-router backend
// (github.com/techit360ai-bit/ai-router). The dashboards were previously 100%
// mock; this is the seam that lets them call the real intelligence engine while
// still rendering offline (see client.ts `withFallback`).

export type ViteEnv = Record<string, string | boolean | undefined>;

export const env: ViteEnv =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {})
    : {};

/**
 * Base URL of the ai-router FastAPI service.
 * Override per environment with VITE_API_BASE_URL.
 * Default matches the backend dev server (uvicorn main:app --port 8000).
 */
export const API_BASE_URL: string =
  (typeof env.VITE_API_BASE_URL === "string"
    ? env.VITE_API_BASE_URL.replace(/\/$/, "")
    : undefined) ?? "http://localhost:8000";

/** API version prefix used by every ai-router endpoint. */
export const API_PREFIX = "/api/v1";

/**
 * True when running a production Vite build. A production runtime must never
 * disguise a failed request as mock data, so this short-circuits the fallback.
 */
export function isProductionBuild(source: ViteEnv = env): boolean {
  return source.PROD === true || source.MODE === "production";
}

/**
 * When true, network failures fall back to bundled mock data instead of throwing,
 * so the UI still renders during local dev / when the backend is down.
 *
 * Fail-closed rule: a production build is ALWAYS strict, regardless of
 * VITE_API_FALLBACK, so mock data can never be shown as if it were real.
 * Disable explicitly in dev with VITE_API_STRICT=1 to surface real errors.
 * The optional `source` argument exists only so tests can exercise the matrix.
 */
export function apiFallbackEnabled(source: ViteEnv = env): boolean {
  if (isProductionBuild(source)) return false;
  if (source.VITE_API_STRICT === "1") return false;
  if (source.VITE_API_FALLBACK !== undefined) return source.VITE_API_FALLBACK === "1";
  return source.MODE === undefined || source.MODE === "development" || source.MODE === "test" || source.DEV === true;
}

/** Build a full URL for an ai-router path (with or without leading slash). */
export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean.startsWith("/api/") ? "" : API_PREFIX}${clean}`;
}
