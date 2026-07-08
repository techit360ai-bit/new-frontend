import { expect, test } from "vitest";

type SmokeCheck = {
  name: string;
  env: string;
  path: string;
  statuses: number[];
  strip?: string;
  token?: string;
  expectJson?: Record<string, string | number | boolean>;
};

type SmokeModule = {
  buildChecks: (env?: Record<string, string | undefined>) => SmokeCheck[];
  probe: (check: SmokeCheck, env?: Record<string, string | undefined>) => Promise<void>;
};

const smokeScriptPath = "../../../scripts/smoke.mjs";

async function loadSmokeScript() {
  return await import(smokeScriptPath) as SmokeModule;
}

test("frontend deploy smoke includes authenticated MCP probe when a bearer token is supplied", async () => {
  const { buildChecks } = await loadSmokeScript();
  const checks = buildChecks({ SMOKE_BEARER_TOKEN: "jwt-smoke" });
  const authenticated = checks.find((check) => check.name === "mcp-authenticated");

  expect(checks.some((check) => check.name === "mcp-auth-boundary")).toBe(true);
  expect(authenticated).toEqual({
    name: "mcp-authenticated",
    env: "VITE_TECHIT_API",
    path: "/health",
    statuses: [200],
    token: "jwt-smoke",
  });
});

test("frontend deploy smoke keeps authenticated MCP probe opt-in", async () => {
  const { buildChecks } = await loadSmokeScript();
  const checks = buildChecks({});

  expect(checks.some((check) => check.name === "mcp-authenticated")).toBe(false);
});

test("frontend deploy smoke sends bearer auth on authenticated probes", async () => {
  const { probe } = await loadSmokeScript();
  const originalFetch = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    await probe(
      {
        name: "mcp-authenticated",
        env: "VITE_TECHIT_API",
        path: "/health",
        statuses: [200],
        token: "jwt-smoke",
      },
      {
        VITE_TECHIT_API: "https://api.techit.example/api/mcp",
        SMOKE_TIMEOUT_MS: "1000",
      },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe("https://api.techit.example/api/mcp/health");
    expect((calls[0][1]?.headers as Record<string, string>).Authorization).toBe("Bearer jwt-smoke");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("frontend deploy smoke validates service identity from response JSON", async () => {
  const { probe } = await loadSmokeScript();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ platform: "TechIT AI Incubation Platform" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    let thrown: Error | undefined;
    try {
      await probe(
        {
          name: "node-backend",
          env: "VITE_API_URL",
          strip: "/api",
          path: "/",
          statuses: [200],
          expectJson: { status: "TechIT API running" },
        },
        {
          VITE_API_URL: "https://api.techit.example/api",
          SMOKE_TIMEOUT_MS: "1000",
        },
      );
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown?.message).toContain("expected TechIT API running");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
