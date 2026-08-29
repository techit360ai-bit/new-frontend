import { test, expect } from "vitest";
import { env } from "@/lib/messaging/config";
import { fetchRtcToken } from "./rtc";

test("fetchRtcToken returns the session on success", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({ token: "t", url: "wss://x", room: "e1", identity: "u1", canPublish: true }),
  })) as unknown as typeof fetch;
  try {
    const s = await fetchRtcToken("e1");
    expect(s?.token).toBe("t");
    expect(s?.canPublish).toBe(true);
  } finally {
    globalThis.fetch = orig;
  }
});

test("fetchRtcToken returns null on failure (offline-safe)", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;
  try {
    expect(await fetchRtcToken("e1")).toBeNull();
  } finally {
    globalThis.fetch = orig;
  }
});

test("fetchRtcToken surfaces failures in strict API mode", async () => {
  const origFetch = globalThis.fetch;
  const previousStrict = env.VITE_API_STRICT;
  env.VITE_API_STRICT = "1";
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;
  try {
    let error: unknown;
    try {
      await fetchRtcToken("e1");
    } catch (err) {
      error = err;
    }

    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("network");
  } finally {
    globalThis.fetch = origFetch;
    if (previousStrict === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previousStrict;
  }
});
