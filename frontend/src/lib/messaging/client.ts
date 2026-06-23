import {
  messagingUrl,
  messagingToken,
  MESSAGING_FALLBACK_ENABLED,
} from "./config";

// See lib/api/client.ts for the rationale — raw fetch has no timeout, and a
// hung Go messaging service would otherwise lock UI surfaces indefinitely.
// 15s is tighter than the ai-router default because messaging endpoints are
// CRUD-only (no agent / LLM step). Override with VITE_MESSAGING_TIMEOUT_MS.
const DEFAULT_TIMEOUT_MS = Number(
  (import.meta.env.VITE_MESSAGING_TIMEOUT_MS as string | undefined) ?? "15000",
) || 15_000;

function timeoutSignal(init?: RequestInit): AbortSignal {
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = messagingToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`messaging ${res.status}`);
  return (await res.json()) as T;
}

export async function msgGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "GET",
    headers: headers(init?.headers),
    ...init,
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function msgPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "POST",
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function msgPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "PATCH",
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function msgDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "DELETE",
    headers: headers(init?.headers),
    ...init,
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

// Mirrors lib/api/client.ts withFallback so screens stay offline-safe.
export async function withFallback<T>(call: () => Promise<T>, fallback: T | (() => T), label?: string): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (!MESSAGING_FALLBACK_ENABLED) throw err;
    if (typeof console !== "undefined") {
      const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
      const tag = isTimeout ? "[msg timeout]" : "[msg]";
      console.warn(`${tag} ${label ?? "request"} failed; using fallback`, err);
    }
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}
