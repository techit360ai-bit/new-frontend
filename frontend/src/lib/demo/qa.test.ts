import { test, expect } from "vitest";
import { listQuestions, askQuestion } from "./qa";

test("listQuestions returns rows on success", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    questions: [{ id: "q1", eventId: "e1", askerId: "u1", body: "why?", state: "open", votes: 2, mine: true, createdAt: "t" }],
  }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
  try {
    const qs = await listQuestions("e1");
    expect(qs).toHaveLength(1);
    expect(qs[0].votes).toBe(2);
    expect(qs[0].mine).toBe(true);
  } finally {
    globalThis.fetch = orig;
  }
});

test("listQuestions returns [] on failure (offline-safe)", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
  try {
    expect(await listQuestions("e1")).toEqual([]);
  } finally {
    globalThis.fetch = orig;
  }
});

test("askQuestion returns null on failure (offline-safe)", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
  try {
    expect(await askQuestion("e1", "hi")).toBeNull();
  } finally {
    globalThis.fetch = orig;
  }
});
