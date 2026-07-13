import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { fetchCollaboratorOpportunities, normalizeCollaboratorOpportunity } from "./opportunities";

function response(body: unknown) {
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

test("collaborator opportunities read canonical BACKEND live endpoint", async () => {
  setAuthTokenGetter(() => "jwt-collaborator");
  const fetchMock = stubFetch(async () => response({
    opportunities: [{
      id: "opp_1",
      title: "Live Build Partner",
      startupName: "LiveCo",
      type: "advisory",
      monthlyCash: "4500",
      equity: 0.2,
      commitment: "5 hrs/week",
      riskLevel: "low",
      teamScore: 84,
      match: 91,
      skills: ["React", "Node"],
      summary: "Help ship the next build.",
      team: [{ name: "Ava", title: "Founder" }],
      duration: "6 weeks",
    }],
  }));

  try {
    const rows = await fetchCollaboratorOpportunities();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe("http://localhost:3000/api/domain/opportunities");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-collaborator");
    expect(rows[0]).toMatchObject({
      id: "opp_1",
      title: "Live Build Partner",
      company: "LiveCo",
      type: "advisory",
      cashCompMonthly: 4500,
      equityPercent: 0.2,
      matchScore: 91,
      status: "open",
    });
    expect(rows[0]?.teamBios).toEqual([{ name: "Ava", role: "Founder" }]);
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("collaborator opportunities return empty live state without fixture records", async () => {
  const fetchMock = stubFetch(async () => response({ opportunities: [] }));

  try {
    await expect(fetchCollaboratorOpportunities()).resolves.toEqual([]);
  } finally {
    fetchMock.restore();
  }
});

test("opportunity normalizer tolerates partial live records", () => {
  expect(normalizeCollaboratorOpportunity({ company: "PartialCo", skills: ["Design"] })).toMatchObject({
    company: "PartialCo",
    title: "Untitled opportunity",
    type: "project",
    riskLevel: "medium",
    skills: ["Design"],
    timeline: "Timeline TBD",
  });
});
