import { test, expect } from "vitest";
import { env } from "@/lib/messaging/config";
import { listEvents } from "./client";

test("listEvents returns [] on failure (offline-safe)", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;

  try {
    expect(await listEvents()).toEqual([]);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("listEvents surfaces failures in strict API mode", async () => {
  const origFetch = globalThis.fetch;
  const previousStrict = env.VITE_API_STRICT;
  env.VITE_API_STRICT = "1";
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;

  try {
    let error: unknown;
    try {
      await listEvents();
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
