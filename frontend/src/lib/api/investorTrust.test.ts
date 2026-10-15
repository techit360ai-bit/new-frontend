import { expect, test } from "vitest";
import {
  fetchInvestorTrustDashboard,
  fetchInvestorTrustStartups,
  requestInvestorTrustAccess,
  saveInvestorTrustNotes,
} from "./investorTrust";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
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

test("fetchInvestorTrustStartups calls the investor-safe startup list endpoint", async () => {
  const payload = {
    startups: [],
    watchlistStartupIds: [],
    privacy: {
      metadataOnly: true,
      approvedEvidenceOnly: true,
      rawPayloadsExposed: false,
      customerDataExposed: false,
      sourceCodeExposed: false,
      investorNotesPrivate: true,
      founderVisible: false,
    },
  };
  const fetchMock = stubFetch(async () => response(payload));

  try {
    const result = await fetchInvestorTrustStartups();

    expect(result).toEqual(payload);
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/startups");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("fetchInvestorTrustDashboard calls the selected startup trust endpoint", async () => {
  const payload = { startup: { startupId: "persisted-startup" } };
  const fetchMock = stubFetch(async () => response(payload));

  try {
    const result = await fetchInvestorTrustDashboard("1");

    expect(result.startup.startupId).toBe("persisted-startup");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/1");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("fetchInvestorTrustDashboard forwards granted consent scopes only when present", async () => {
  const fetchMock = stubFetch(async () => response({ startup: { startupId: "1" } }));

  try {
    await fetchInvestorTrustDashboard("1", ["revenue_metrics", " founder_identity "]);
    const [scopedUrl] = fetchMock.calls[0] as [string, RequestInit];
    expect(scopedUrl).toBe("http://localhost:8000/api/v1/investor/trust/1?scopes=revenue_metrics%2Cfounder_identity");

    await fetchInvestorTrustDashboard("1", []);
    const [unscopedUrl] = fetchMock.calls[1] as [string, RequestInit];
    expect(unscopedUrl).toBe("http://localhost:8000/api/v1/investor/trust/1");
  } finally {
    fetchMock.restore();
  }
});

test("saveInvestorTrustNotes keeps notes private behind the investor trust notes endpoint", async () => {
  const notes = {
    note: "Persisted diligence note",
    internalRating: "watch" as const,
    followUpReminder: "",
    checklist: [],
    bookmarked: false,
  };
  const fetchMock = stubFetch(async () => response({ ok: true, investorNotes: notes }));

  try {
    const result = await saveInvestorTrustNotes("1", notes);

    expect(result).toEqual({ ok: true, investorNotes: notes });
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/1/notes");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(notes));
  } finally {
    fetchMock.restore();
  }
});

test("requestInvestorTrustAccess asks for the full consent catalog so the founder can choose", async () => {
  const { calls, restore } = stubFetch(() =>
    response({ ok: true, created: true, request: { id: "req-1", grantedScopes: [] } }),
  );
  try {
    await requestInvestorTrustAccess("startup-1", "Due diligence");
    const [url, init] = calls[0];
    expect(url).toContain("/investor/trust/startup-1/access-request");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      purpose: "Due diligence",
      requestedScopes: ["approved_evidence_metadata", "execution_metrics", "cohort_benchmarks", "revenue_metrics"],
    });
  } finally {
    restore();
  }
});

test("fetchInvestorTrustDashboard only forwards the granted consent scopes", async () => {
  const { calls, restore } = stubFetch(() => response({ privacy: {} }));
  try {
    await fetchInvestorTrustDashboard("startup-1", ["approved_evidence_metadata", "execution_metrics"]);
    expect(calls[0][0]).toContain("scopes=approved_evidence_metadata%2Cexecution_metrics");
  } finally {
    restore();
  }
});
