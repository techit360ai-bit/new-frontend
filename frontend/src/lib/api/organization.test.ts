import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  fetchOrganizationDashboard,
  normalizeOrganizationDashboard,
} from "./organization";

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return handler(String(url), init);
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test("organization dashboard reads the authenticated canonical domain endpoint", async () => {
  setAuthTokenGetter(() => "jwt-organization");
  const fetchMock = stubFetch(async () => response({
    metrics: { activePrograms: 2, hackathons: 1, members: 14, opportunities: 3 },
    activity: [],
    charts: {},
  }));

  try {
    const dashboard = await fetchOrganizationDashboard();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe("http://localhost:3000/api/domain/organization/dashboard");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-organization");
    expect(dashboard.metrics).toEqual({
      activePrograms: 2,
      hackathons: 1,
      members: 14,
      opportunities: 3,
    });
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("organization dashboard accepts persisted empty states without demo records", async () => {
  const fetchMock = stubFetch(async () => response({
    dashboard: null,
    metrics: {},
    activity: [],
    charts: {},
  }));

  try {
    await expect(fetchOrganizationDashboard()).resolves.toEqual({
      metrics: { activePrograms: 0, hackathons: 0, members: 0, opportunities: 0 },
      projectHealth: [],
      talentActivity: [],
      automation: [],
      activity: [],
    });
  } finally {
    fetchMock.restore();
  }
});

test("organization dashboard normalizes persisted chart and activity aliases", () => {
  expect(normalizeOrganizationDashboard({
    metrics: { members: "8" },
    charts: {
      projectHealthData: [{ status: "Progressing", count: 4 }],
      talentActivity: [{ name: "Engineering", value: 5 }],
      automationTrend: [{ period: "July", automated: 9, manual: 3 }],
    },
    activity: [{ summary: "New program created", createdAt: "2026-07-15T10:00:00Z" }],
  })).toMatchObject({
    metrics: { members: 8 },
    projectHealth: [{ name: "Progressing", value: 4 }],
    talentActivity: [{ skill: "Engineering", count: 5 }],
    automation: [{ label: "July", automated: 9, manual: 3 }],
    activity: [{ message: "New program created", at: "2026-07-15T10:00:00Z" }],
  });
});
