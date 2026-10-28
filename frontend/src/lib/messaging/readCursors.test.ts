import { expect, test } from "vitest";
import { markChannelRead } from "./channels";
import { markConvRead } from "./conversations";

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("messaging read cursors persist through the canonical endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return response({ status: "ok" });
  }) as typeof fetch;

  try {
    await markConvRead("conversation-live", "message-dm");
    await markChannelRead("channel-live", "message-channel");

    expect(calls.map(([url, init]) => ({
      url,
      method: init?.method,
      body: init?.body,
    }))).toEqual([
      {
        url: "http://localhost:8080/api/v1/conversations/conversation-live/read",
        method: "POST",
        body: JSON.stringify({ msgId: "message-dm" }),
      },
      {
        url: "http://localhost:8080/api/v1/channels/channel-live/read",
        method: "POST",
        body: JSON.stringify({ msgId: "message-channel" }),
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
