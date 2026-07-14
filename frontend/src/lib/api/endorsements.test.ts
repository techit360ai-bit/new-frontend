import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { createEndorsement, fetchEndorsements } from "./endorsements";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
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

test("endorsements read the authenticated domain endpoint and accept an empty live state", async () => {
  setAuthTokenGetter(() => "jwt-endorsements");
  const fetchMock = stubFetch(async () => response({ endorsements: [] }));

  try {
    await expect(fetchEndorsements()).resolves.toEqual([]);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/endorsements");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-endorsements");
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("endorsement creation writes the target, quote, and optional project to the domain endpoint", async () => {
  const endorsement = {
    id: "endorsement_1",
    subjectId: "user_2",
    authorId: "user_1",
    authorName: "Live Founder",
    authorRole: "founder",
    quote: "Delivered the release.",
    projectId: "project_1",
    projectName: "Live Project",
    createdAt: "2026-07-14T10:00:00Z",
    updatedAt: "2026-07-14T10:00:00Z",
  };
  const fetchMock = stubFetch(async () => response({ endorsement }, 201));

  try {
    await expect(createEndorsement({
      subjectUserId: "user_2",
      quote: "Delivered the release.",
      projectId: "project_1",
    })).resolves.toEqual(endorsement);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/endorsements");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      subjectUserId: "user_2",
      quote: "Delivered the release.",
      projectId: "project_1",
    });
  } finally {
    fetchMock.restore();
  }
});
