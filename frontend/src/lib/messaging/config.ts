// Messaging service config - a SEPARATE origin from ai-router (lib/api/config.ts).
export type ViteEnv = Record<string, string | boolean | undefined>;

export const env: ViteEnv =
  typeof import.meta !== "undefined"
    ? { ...((import.meta as unknown as { env?: ViteEnv }).env ?? {}) }
    : {};


export const MESSAGING_BASE_URL: string =
  (typeof env.VITE_MESSAGING_BASE_URL === "string"
    ? env.VITE_MESSAGING_BASE_URL
    : "http://localhost:8080").replace(/\/$/, "");

export const MESSAGING_WS_URL: string =
  typeof env.VITE_MESSAGING_WS_URL === "string"
    ? env.VITE_MESSAGING_WS_URL
    : "ws://localhost:8080/ws";

export const MESSAGING_PREFIX = "/api/v1";

/**
 * Mirrors lib/api/config.ts: a production build is always strict. Mock data
 * must never be rendered as if it came from the messaging service.
 * The optional `source` argument exists only so tests can exercise the matrix.
 */
export function messagingFallbackEnabled(source: ViteEnv = env): boolean {
  if (source.MODE === "test" && source.VITE_API_STRICT !== "1") return true;
  if (source.PROD === true || source.MODE === "production") return false;
  if (typeof source.VITE_API_STRICT === "string" ? source.VITE_API_STRICT.trim() === "1" : Boolean(source.VITE_API_STRICT)) return false;
  if (source.VITE_API_FALLBACK !== undefined) return source.VITE_API_FALLBACK === "1";
  return source.MODE === undefined || source.MODE === "development" || source.DEV === true;
}






// Auth token getter; defaults to the AuthContext localStorage key.
let tokenGetter: () => string | null = () => {
  try {
    return (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem("techit_access_token") : null) || (import.meta.env.MODE === 'test' ? localStorage.getItem("techit_token") : null);
  } catch {
    return null;
  }
};
export function setMessagingToken(getter: () => string | null) {
  tokenGetter = getter;
}
export function messagingToken(): string | null {
  return tokenGetter();
}

export function messagingUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${MESSAGING_BASE_URL}${clean.startsWith(MESSAGING_PREFIX) ? "" : MESSAGING_PREFIX}${clean}`;
}
