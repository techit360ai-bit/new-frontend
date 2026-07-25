// Messaging service config - a SEPARATE origin from ai-router (lib/api/config.ts).
export type ViteEnv = Record<string, string | boolean | undefined>;

export const env: ViteEnv =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {})
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

export function messagingFallbackEnabled(): boolean {
  if (env.VITE_API_STRICT === "1") return false;
  if (env.VITE_API_FALLBACK !== undefined) return env.VITE_API_FALLBACK === "1";
  return env.MODE === undefined || env.MODE === "development" || env.MODE === "test" || env.DEV === true;
}

// Auth token getter; defaults to the AuthContext localStorage key.
let tokenGetter: () => string | null = () => {
  try {
    return localStorage.getItem("techit_token");
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
