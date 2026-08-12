import { afterEach, expect, test, vi } from "vitest";
import { setAuthTokenGetter } from "./client";
import { analyzePivot, createSandboxBuild, runVenturePipeline, startValidation, submitFounderAnswers } from "./incubation";

afterEach(() => {
  vi.unstubAllGlobals();
  setAuthTokenGetter(() => null);
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("pipeline forwards founder geography and selected model", async () => {
  setAuthTokenGetter(() => "jwt-incubation");
  const fetchMock = vi.fn(async () => response({ project_id: "p1", incubation_session_id: "s1" }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(runVenturePipeline({ startup_name: "Venture", target_geography: "Hungary", model_id: "gpt-5.6-sol" })).resolves.toMatchObject({ project_id: "p1" });
  expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ body: JSON.stringify({ startup_name: "Venture", target_geography: "Hungary", model_id: "gpt-5.6-sol" }) });
});

test("pivot contract wraps venture data and score", async () => {
  const fetchMock = vi.fn(async () => response({ analysis: "pivot" }));
  vi.stubGlobal("fetch", fetchMock);
  await analyzePivot({ startup_name: "Venture", unicorn_potential_score: 42 });
  expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ body: JSON.stringify({ venture_data: { startup_name: "Venture", unicorn_potential_score: 42 }, unicorn_score: 42 }) });
});

test("validation and sandbox endpoints expose approval workflow", async () => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/validation/start")) return response({ session: { id: "s1" }, founder_questions: [] });
    if (url.endsWith("/answers")) return response({ session: { id: "s1" }, founder_questions: [], validation_blocked: false });
    return response({ id: "b1", status: "preview_ready" });
  });
  vi.stubGlobal("fetch", fetchMock);
  await startValidation({ startup_name: "Venture" });
  await submitFounderAnswers("s1", { customer: "SMBs" });
  await createSandboxBuild("s1", "one_day_prototype", "w1");
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "http://localhost:8000/api/v1/incubation/validation/start",
    "http://localhost:8000/api/v1/incubation/validation/s1/answers",
    "http://localhost:8000/api/v1/incubation/validation/s1/builds",
  ]);
});
