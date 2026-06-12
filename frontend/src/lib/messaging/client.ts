import {
  messagingUrl,
  messagingToken,
  MESSAGING_FALLBACK_ENABLED,
} from "./config";

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
  const res = await fetch(messagingUrl(path), { method: "GET", headers: headers(init?.headers), ...init });
  return parse<T>(res);
}

export async function msgPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "POST",
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
  return parse<T>(res);
}

export async function msgDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), { method: "DELETE", headers: headers(init?.headers), ...init });
  return parse<T>(res);
}

// Mirrors lib/api/client.ts withFallback so screens stay offline-safe.
export async function withFallback<T>(call: () => Promise<T>, fallback: T | (() => T), label?: string): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (!MESSAGING_FALLBACK_ENABLED) throw err;
    if (typeof console !== "undefined") console.warn(`[msg] ${label ?? "request"} failed; using fallback`, err);
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}
