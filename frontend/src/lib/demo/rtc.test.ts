import { test, expect } from "vitest";
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
