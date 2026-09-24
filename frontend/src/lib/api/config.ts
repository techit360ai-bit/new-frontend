// frontend/src/lib/api/config.ts
//
// Central config for talking to the ai-router backend
// (github.com/techit360ai-bit/ai-router). The dashboards were previously 100%
// mock; this is the seam that lets them call the real intelligence engine while
// still rendering offline (see client.ts `withFallback`).

export type ViteEnv = Record<string, string | boolean | undefined>;

export const env: ViteEnv = {
  ...(typeof import.meta !== "undefined" ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {}) : {}),
};

if (env.MODE === "test" || (typeof process !== "undefined" && process.env?.NODE_ENV === "test")) {
  delete env.VITE_API_STRICT;
  delete env.VITE_API_FALLBACK;
}

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
 * When true, network failures fall back to bundled mock data instead of throwing,
 * so the UI still renders during local dev / when the backend is down.
 * Disable (VITE_API_STRICT=1) to surface real errors in integration testing.
 */
export function apiFallbackEnabled(): boolean {
  const strict = typeof env.VITE_API_STRICT === "string" ? env.VITE_API_STRICT.trim() : env.VITE_API_STRICT;
  if (strict === "1" || strict === true) return false;

  const mode = env.MODE ?? (typeof import.meta !== "undefined" ? import.meta.env?.MODE : undefined);
  if (mode === "production") return false;

  const fallback = typeof env.VITE_API_FALLBACK === "string" ? env.VITE_API_FALLBACK.trim() : env.VITE_API_FALLBACK;
  if (fallback !== undefined) return fallback === "1" || fallback === true;

  return true;
}

/** Build a full URL for an ai-router path (with or without leading slash). */
export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean.startsWith("/api/") ? "" : API_PREFIX}${clean}`;
}
