import { expect, test } from "vitest";
import { converseWithHavi, fetchTourGuideCheckIn, type TourGuideCheckInPayload } from "./tourGuide";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

test("fetchTourGuideCheckIn posts Havi state to the tour guide endpoint", async () => {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return response({
      momentum_score: 73,
      daily_plan: ["Ship the narrowest MVP proof"],
      ai_insights: ["Team momentum is improving"],
      alerts: [],
      stagnation_risk: false,
    });
  }) as typeof fetch;

  const payload: TourGuideCheckInPayload = {
    source: "havi",
    role: "founder",
    firstLanding: true,
    route: "/dashboard",
    profile: { startupName: "AI Task Manager", teamSize: 3 },
    mvp: {
      targetDate: "2026-08-01",
      daysRemaining: 31,
      overdue: false,
      completionPercentage: 25,
    },
    tasks: [
      { id: "f1", title: "Finalize problem statement", completed: false, estimatedMinutes: 45 },
    ],
  };

  try {
    const result = await fetchTourGuideCheckIn(payload);

    expect(result?.momentum_score).toBe(73);
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/tour-guide/daily-check-in");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
  } finally {
    globalThis.fetch = original;
  }
});

test("converseWithHavi uses the live tour-guide conversation route", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url, init) => {
    calls.push(String(url));
    expect(JSON.parse(String(init?.body))).toMatchObject({ source: "havi", role: "collaborator", message: "What next?" });
    return response({ message: "Use the next assigned task." });
  }) as typeof fetch;
  try {
    await expect(converseWithHavi({ source: "havi", role: "collaborator", profile: {}, conversation: [], message: "What next?" })).resolves.toMatchObject({ message: "Use the next assigned task." });
    expect(calls[0]).toBe("http://localhost:8000/api/v1/tour-guide/conversation");
  } finally {
    globalThis.fetch = original;
  }
});
