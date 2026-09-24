// Messaging service config - a SEPARATE origin from ai-router (lib/api/config.ts).
export type ViteEnv = Record<string, string | boolean | undefined>;

export const env: ViteEnv = {
  ...(typeof import.meta !== "undefined" ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {}) : {}),
};

if (env.MODE === "test" || (typeof process !== "undefined" && process.env?.NODE_ENV === "test")) {
  delete env.VITE_API_STRICT;
  delete env.VITE_API_FALLBACK;
}

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
  const mode = env.MODE ?? (typeof import.meta !== "undefined" ? import.meta.env?.MODE : undefined);
  const strict = typeof env.VITE_API_STRICT === "string" ? env.VITE_API_STRICT.trim() : env.VITE_API_STRICT;
  if (strict === "1" || strict === true) return false;

  if (mode === "production") return false;

  const fallback = typeof env.VITE_API_FALLBACK === "string" ? env.VITE_API_FALLBACK.trim() : env.VITE_API_FALLBACK;
  if (fallback !== undefined) return fallback === "1" || fallback === true;

  return true;
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
