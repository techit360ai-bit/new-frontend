// Messaging service config — a SEPARATE origin from ai-router (lib/api/config.ts).
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

export const MESSAGING_BASE_URL: string =
  (env.VITE_MESSAGING_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export const MESSAGING_WS_URL: string =
  env.VITE_MESSAGING_WS_URL ?? "ws://localhost:8080/ws";

export const MESSAGING_PREFIX = "/api/v1";

export const MESSAGING_FALLBACK_ENABLED: boolean = env.VITE_API_STRICT !== "1";

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
