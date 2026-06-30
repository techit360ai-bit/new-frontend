// frontend/src/lib/api/health.ts
//
// ai-router health probe. Unlike the dashboard endpoints, /health sits at the
// service root (NOT under /api/v1), so it bypasses apiUrl() and hits
// API_BASE_URL directly. Useful for a connection indicator / pre-demo check.

import { API_BASE_URL, apiFallbackEnabled } from "./config";

export interface HealthStatus {
  ok: boolean;
  /** Raw payload from the backend when reachable (status/version/etc.). */
  detail?: unknown;
}

/** GET {API_BASE_URL}/health — returns {ok:false} on any failure (unless strict). */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    const detail = text ? JSON.parse(text) : null;
    return { ok: res.ok, detail };
  } catch (err) {
    if (!apiFallbackEnabled()) throw err;
    if (typeof console !== "undefined") {
      console.warn("[api] health check failed; backend unreachable", err);
    }
    return { ok: false };
  }
}
