import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  fetchCollaboratorOpportunities,
  broadcastCollaborationCall,
  normalizeCollaboratorOpportunity,
  normalizePublishedOpportunity,
  patchCollaboratorOpportunityStatus,
} from "./opportunities";

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

test("collaborator opportunities honor broadcast audience roles", async () => {
  const fetchMock = stubFetch(async () => response({
    opportunities: [
      { id: "visible", type: "collaboration", title: "Visible", audienceRoles: ["collaborator"] },
      { id: "founders", type: "collaboration", title: "Founders", audienceRoles: ["founder"] },
    ],
  }));
  try {
    await expect(fetchCollaboratorOpportunities()).resolves.toEqual([
      expect.objectContaining({ id: "visible" }),
    ]);
  } finally {
    fetchMock.restore();
  }
});

test("collaborator opportunity status persists through BACKEND domain endpoint", async () => {
  const fetchMock = stubFetch(async () => response({
    opportunity: { id: "opp_1", title: "Live Opportunity", company: "LiveCo", status: "applied" },
  }));

  try {
    await expect(patchCollaboratorOpportunityStatus("opp_1", "applied")).resolves.toMatchObject({
      id: "opp_1",
      status: "applied",
    });

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/opportunities/opp_1");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ status: "applied" }));
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

test("broadcasts an ownership-focused collaboration call with future audience metadata", async () => {
  const fetchMock = stubFetch(async (_url, init) => response({ opportunity: { id: "opp_call", type: "collaboration", visibility: "public", status: "open", ...JSON.parse(String(init?.body)) } }));
  try {
    const created = await broadcastCollaborationCall({
      projectId: "project_1",
      projectName: "LedgerCare",
      summary: "LedgerCare helps clinics reconcile patient payments.",
      scope: "Own the reconciliation API.",
      requestedRole: "Backend Engineer",
      requiredSkills: ["Node.js", "Postgres"],
      desiredWeeklyHours: 20,
      earliestStart: "2-weeks",
      commitmentStyle: "deep",
      compensationMode: "equity-heavy",
      equityProposal: 4,
      cashReward: 0,
      industry: "HealthTech",
    }, ["collaborator", "founder", "explorer"]);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(url).toBe("http://localhost:3000/api/domain/opportunities/collaboration-calls");
    expect(body).toMatchObject({
      compensationMode: "equity-heavy",
      equityPercent: 4,
      cashCompMonthly: 0,
      audienceRoles: ["collaborator", "founder", "explorer"],
    });
    expect(created.type).toBe("collaboration");
  } finally {
    fetchMock.restore();
  }
});

test("normalizes collaboration calls for the founder opportunity hub", () => {
  expect(normalizePublishedOpportunity({
    id: "opp_call",
    type: "collaboration",
    title: "Backend Engineer for LedgerCare",
    company: "LedgerCare",
    summary: "Build the API",
    status: "open",
    equityPercent: 4,
    cashCompMonthly: 0,
    audienceRoles: ["founder", "collaborator"],
  })).toMatchObject({
    id: "opp_call",
    type: "collaboration",
    role: "",
    equityPercent: 4,
    audienceRoles: ["founder", "collaborator"],
  });
});
