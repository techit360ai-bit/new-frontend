import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { createTvceCheckout, fetchCheckoutProviders, fetchFreeUsage } from "./tvce";

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
    restore: () => { globalThis.fetch = original; },
  };
}

test("TVCE calls target the BACKEND /api/tvce endpoints", async () => {
  setAuthTokenGetter(() => "jwt-tvce");
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/tvce/free-usage")) return response({ usage: [] });
    if (url.endsWith("/tvce/checkout/providers")) return response({ providers: { stripe: true, paystack: false, flutterwave: false } });
    if (url.endsWith("/tvce/checkout/session")) {
      return response({ ok: true, checkoutUrl: "https://pay.test/1", paymentIntent: { id: "pay_1", amount: 100, currency: "USD", credits: 10, status: "pending" } });
    }
    throw new Error(`unexpected ${url}`);
  });

  try {
    await fetchFreeUsage();
    await fetchCheckoutProviders();
    await createTvceCheckout({ provider: "stripe", amount: 100, currency: "USD" });

    expect(fetchMock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3000/api/tvce/free-usage",
      "http://localhost:3000/api/tvce/checkout/providers",
      "http://localhost:3000/api/tvce/checkout/session",
    ]);
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-tvce");
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});
