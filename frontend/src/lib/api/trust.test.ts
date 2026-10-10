import { expect, test } from "vitest";
import { applyTrustOverride, connectIdentityCredential, connectRevenueCredential, connectShippingCredential, connectTeamCredential, createMilestoneEvidenceUpload, disconnectIdentityCredential, disconnectTeamCredential, fetchIdentity, fetchIdentityScreening, fetchMilestones, fetchTeamCredentials, fetchTrustProfile, fetchTrustReverificationDue, fetchUserTrustOverrides, finalizeMilestoneEvidence, refreshTrustSource, requestTeamWorkEmailChallenge, reviewTrustMilestone, revokeTrustOverride, runIdentityScreening, submitTrustMilestone, verifyIdentityKyc, verifyIdentityRegistry, verifyRevenueSource, verifyShippingSource, verifyTeamHrisSource, verifyTeamRegistrySource, verifyTeamWorkEmailChallenge } from "./trust";

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

test("fetchTrustProfile calls the ai-router Trust profile endpoint", async () => {
  const fetchMock = stubFetch(async () => response({ trust_score: 72, tier: "Verified" }));

  try {
    const profile = await fetchTrustProfile();

    expect(profile.trust_score).toBe(72);
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/trust/profile");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("refreshTrustSource posts to the source-specific manual reverification endpoint", async () => {
  const fetchMock = stubFetch(async () => response({
    source: "github",
    status: "pending",
    confidence: 0.5,
    metadata_hash: "hash",
    raw_payload_stored: false,
  }));

  try {
    const result = await refreshTrustSource("github");

    expect(result.source).toBe("github");
    expect(result.status).toBe("pending");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/trust/refresh/github");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({}));
  } finally {
    fetchMock.restore();
  }
});

test("connectRevenueCredential posts the read-only key to the backend revenue route", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, credential: { provider: "stripe", scopes: ["read_only"], mode: "test", stored: true, secret_stored: false, raw_payload_stored: false } }));

  try {
    const result = await connectRevenueCredential("stripe", "rk_test_123");

    expect(result.credential.secret_stored).toBe(false);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/revenue/connect");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ provider: "stripe", credential: "rk_test_123" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyRevenueSource triggers a server-observed read", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, provider: "stripe", status: "verified" }));

  try {
    const result = await verifyRevenueSource("stripe");

    expect(result.status).toBe("verified");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/revenue/verify");
    expect(init.method).toBe("POST");
  } finally {
    fetchMock.restore();
  }
});

test("connectShippingCredential posts the read-only token to the backend shipping route", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, credential: { provider: "vercel", scopes: ["read_only"], mode: null, stored: true, secret_stored: false, raw_payload_stored: false } }));

  try {
    const result = await connectShippingCredential("vercel", "vc_secret_123", "prj_abc");

    expect(result.credential.secret_stored).toBe(false);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/shipping/connect");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ provider: "vercel", credential: "vc_secret_123", subject: "prj_abc" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyShippingSource triggers a server-observed cadence read", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, provider: "vercel", status: "verified" }));

  try {
    const result = await verifyShippingSource("vercel");

    expect(result.status).toBe("verified");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/shipping/verify");
    expect(init.method).toBe("POST");
  } finally {
    fetchMock.restore();
  }
});

test("requestTeamWorkEmailChallenge posts the work email (and role) to the backend route", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, challenge: { id: "ch1", status: "pending" }, dev_code: "123456" }));

  try {
    const result = await requestTeamWorkEmailChallenge("jane@acme.com", "cto");

    expect(result.challenge.status).toBe("pending");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/work-email/challenge");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "jane@acme.com", role: "cto" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyTeamWorkEmailChallenge posts the challenge id and code", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, status: "verified" }));

  try {
    const result = await verifyTeamWorkEmailChallenge("ch1", "123456");

    expect(result.status).toBe("verified");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/work-email/verify");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ challengeId: "ch1", code: "123456" }));
  } finally {
    fetchMock.restore();
  }
});

test("connectTeamCredential posts a founder registry/HRIS credential and never returns the secret", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, credential: { provider: "opencorporates", scopes: ["read_only"], mode: null, stored: true, secret_stored: false, raw_payload_stored: false } }));

  try {
    const result = await connectTeamCredential("registry", "opencorporates", "oc_secret_123", "gb/123");

    expect(result.credential.secret_stored).toBe(false);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/connect");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ kind: "registry", provider: "opencorporates", credential: "oc_secret_123", subject: "gb/123" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyTeamRegistrySource POSTs provider and founder input", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, provider: "opencorporates", status: "verified" }));

  try {
    const result = await verifyTeamRegistrySource("opencorporates", { companyNumber: "gb/123", founderName: "Jane Doe" });

    expect(result.status).toBe("verified");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/registry/verify");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ provider: "opencorporates", companyNumber: "gb/123", founderName: "Jane Doe" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyTeamHrisSource POSTs the provider only", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, provider: "gusto", status: "verified" }));

  try {
    const result = await verifyTeamHrisSource("gusto");

    expect(result.status).toBe("verified");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/hris/verify");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ provider: "gusto" }));
  } finally {
    fetchMock.restore();
  }
});

test("fetchTeamCredentials GETs the team credential list", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, credentials: [] }));

  try {
    const result = await fetchTeamCredentials();

    expect(result.credentials).toEqual([]);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/credentials");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("disconnectTeamCredential DELETEs the encoded provider route", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, provider: "opencorporates", status: "disconnected" }));

  try {
    const result = await disconnectTeamCredential("opencorporates");

    expect(result.status).toBe("disconnected");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/team/credential/opencorporates");
    expect(init.method).toBe("DELETE");
  } finally {
    fetchMock.restore();
  }
});

test("fetchMilestones GETs the node-local milestone list", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, milestones: [] }));

  try {
    const result = await fetchMilestones();

    expect(result.milestones).toEqual([]);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/milestone");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("createMilestoneEvidenceUpload POSTs the content type and size", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, evidence: { id: "ev-1", status: "upload_pending" }, uploadUrl: "https://storage.example/put", requiredHeaders: { "Content-Type": "application/pdf" } }));

  try {
    const result = await createMilestoneEvidenceUpload("application/pdf", 1024);

    expect(result.uploadUrl).toBe("https://storage.example/put");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/milestone/evidence");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ contentType: "application/pdf", sizeBytes: 1024 }));
  } finally {
    fetchMock.restore();
  }
});

test("finalizeMilestoneEvidence POSTs the encoded evidence finalize route", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, evidence: { id: "ev-1", status: "available", sha256: "abc" } }));

  try {
    const result = await finalizeMilestoneEvidence("ev-1");

    expect(result.evidence.sha256).toBe("abc");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/milestone/evidence/ev-1/finalize");
    expect(init.method).toBe("POST");
  } finally {
    fetchMock.restore();
  }
});

test("submitTrustMilestone POSTs a milestone backed by scanned evidence", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, status: "pending", milestone: { id: "m1", type: "funding" } }));

  try {
    const result = await submitTrustMilestone({ type: "funding", evidenceId: "ev-1" });

    expect(result.status).toBe("pending");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/milestone");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ type: "funding", evidenceId: "ev-1" }));
  } finally {
    fetchMock.restore();
  }
});

test("reviewTrustMilestone POSTs the admin decision with a reason code", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, proof: { id: "m1", status: "rejected" } }));

  try {
    const result = await reviewTrustMilestone({ proofId: "m1", decision: "rejected", reasonCode: "illegible_document" });

    expect((result as { proof: { status: string } }).proof.status).toBe("rejected");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/milestone/review");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ proofId: "m1", decision: "rejected", reasonCode: "illegible_document" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyIdentityKyc POSTs the provider + reference (plus country when set)", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, status: "verified" }));

  try {
    await verifyIdentityKyc("persona", "inq_1", "HU");

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/identity/verify");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ provider: "persona", reference: "inq_1", country: "HU" }));
  } finally {
    fetchMock.restore();
  }
});

test("verifyIdentityRegistry POSTs the entity lookup", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, status: "verified" }));

  try {
    await verifyIdentityRegistry("opencorporates", "123", "Jane Doe");

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/identity/registry/verify");
    expect(init.body).toBe(JSON.stringify({ provider: "opencorporates", companyNumber: "123", founderName: "Jane Doe" }));
  } finally {
    fetchMock.restore();
  }
});

test("runIdentityScreening POSTs the legal name and reads back append-only rows", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, screening: { status: "clear" } }));

  try {
    await runIdentityScreening("ofac", "Jane Doe");
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ provider: "ofac", name: "Jane Doe" }));
  } finally {
    fetchMock.restore();
  }
});

test("connectIdentityCredential stores a read-only key", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, kind: "kyc", credential: { provider: "persona", scopes: ["read_only"] } }));

  try {
    const result = await connectIdentityCredential("persona", "key", "inq_1");
    expect(result.kind).toBe("kyc");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/identity/connect");
    expect(init.body).toBe(JSON.stringify({ provider: "persona", credential: "key", subject: "inq_1" }));
  } finally {
    fetchMock.restore();
  }
});

test("fetchIdentity GETs verifications + screening state", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, verifications: [], screening: [], screening_due: true, rescreen_days: 30 }));

  try {
    const result = await fetchIdentity();
    expect(result.screening_due).toBe(true);
    expect(fetchMock.calls[0][0]).toBe("http://localhost:3000/api/trust/identity");
  } finally {
    fetchMock.restore();
  }
});

test("fetchIdentityScreening GETs the append-only history and disconnect encodes the provider", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, screening: [] }));

  try {
    const result = await fetchIdentityScreening();
    expect(result.screening).toEqual([]);
    await disconnectIdentityCredential("persona");
    const [url, init] = fetchMock.calls[1] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/identity/persona");
    expect(init.method).toBe("DELETE");
  } finally {
    fetchMock.restore();
  }
});

test("fetchTrustReverificationDue reads the read-only expiry preview", async () => {
  const fetchMock = stubFetch(async () => response({ now: "x", due_proof_count: 2, due_skill_count: 1, sources: ["revenue"] }));

  try {
    const result = await fetchTrustReverificationDue();
    expect(result.due_proof_count).toBe(2);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/reverification/due");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("applyTrustOverride POSTs a reason-coded, time-boxed delta", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, override: { id: "ov_1", delta: 5, reasonCode: "goodwill_credit" } }));

  try {
    const result = await applyTrustOverride({ userId: "u1", delta: 5, reasonCode: "goodwill_credit", expiresAt: "2099-01-01T00:00:00.000Z" });
    expect(result.override.id).toBe("ov_1");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/trust/admin/overrides");
    expect(init.method).toBe("POST");
  } finally {
    fetchMock.restore();
  }
});

test("fetchUserTrustOverrides + revokeTrustOverride encode the user and override ids", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, overrides: [] }));

  try {
    await fetchUserTrustOverrides("user/1");
    await revokeTrustOverride("user/1", "ov 2");
    const [listUrl] = fetchMock.calls[0] as [string, RequestInit];
    const [revokeUrl, revokeInit] = fetchMock.calls[1] as [string, RequestInit];
    expect(listUrl).toBe("http://localhost:3000/api/trust/admin/users/user%2F1/overrides");
    expect(revokeUrl).toBe("http://localhost:3000/api/trust/admin/users/user%2F1/overrides/ov%202");
    expect(revokeInit.method).toBe("DELETE");
  } finally {
    fetchMock.restore();
  }
});
