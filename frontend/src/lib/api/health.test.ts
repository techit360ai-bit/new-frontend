import { expect, test } from "vitest";
import { env } from "./config";
import { checkHealth } from "./health";

function captureWarn() {
  const original = console.warn;
  const calls: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };

  return {
    calls,
    restore: () => {
      console.warn = original;
    },
  };
}

test("checkHealth returns unhealthy status on failure when fallback mode is enabled", async () => {
  const origFetch = globalThis.fetch;
  const warn = captureWarn();
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;

  try {
    expect(await checkHealth()).toEqual({ ok: false });
    expect(warn.calls).toHaveLength(1);
    expect(String(warn.calls[0][0])).toContain("health check failed");
  } finally {
    globalThis.fetch = origFetch;
    warn.restore();
  }
});

test("checkHealth rethrows failures when strict API mode is enabled", async () => {
  const origFetch = globalThis.fetch;
  const previousStrict = env.VITE_API_STRICT;
  const warn = captureWarn();
  env.VITE_API_STRICT = "1";
  globalThis.fetch = (async () => { throw new Error("network"); }) as unknown as typeof fetch;

  try {
    let error: unknown;
    try {
      await checkHealth();
    } catch (err) {
      error = err;
    }

    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("network");
    expect(warn.calls).toHaveLength(0);
  } finally {
    globalThis.fetch = origFetch;
    if (previousStrict === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previousStrict;
    warn.restore();
  }
});
