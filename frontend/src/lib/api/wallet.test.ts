import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  createWalletPaymentIntent,
  fetchBillingPlans,
  fetchCreditPackages,
  fetchWalletSummary,
  fetchWalletSubscriptions,
  fetchWalletInvoices,
  fetchWalletTransactions,
  fetchWalletUsage,
} from "./wallet";

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

test("wallet API reads canonical BACKEND domain wallet endpoints", async () => {
  setAuthTokenGetter(() => "jwt-wallet");
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/wallet/summary")) return response({ creditBalance: 0, lifetimeCreditsUsed: 0, pendingPayments: 0, account: {} });
    if (url.endsWith("/wallet/usage")) return response({ usage: [] });
    if (url.endsWith("/wallet/transactions")) return response({ transactions: [] });
    if (url.endsWith("/wallet/credit-packages")) return response({ creditPackages: [] });
    if (url.endsWith("/wallet/plans")) return response({ plans: [] });
    if (url.endsWith("/wallet/subscriptions")) return response({ subscriptions: [] });
    if (url.endsWith("/wallet/invoices")) return response({ invoices: [] });
    throw new Error(`unexpected ${url}`);
  });

  try {
    await fetchWalletSummary();
    await fetchWalletUsage();
    await fetchWalletTransactions();
    await fetchCreditPackages();
    await fetchBillingPlans();
    await fetchWalletSubscriptions();
    await fetchWalletInvoices();

    expect(fetchMock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3000/api/domain/wallet/summary",
      "http://localhost:3000/api/domain/wallet/usage",
      "http://localhost:3000/api/domain/wallet/transactions",
      "http://localhost:3000/api/domain/wallet/credit-packages",
      "http://localhost:3000/api/domain/wallet/plans",
      "http://localhost:3000/api/domain/wallet/subscriptions",
      "http://localhost:3000/api/domain/wallet/invoices",
    ]);
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-wallet");
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("wallet API creates payment intents without local fake payments", async () => {
  const fetchMock = stubFetch(async () => response({
    paymentIntent: { id: "pay_1", amount: 500, currency: "USD", credits: 200, status: "pending" },
  }));

  try {
    const result = await createWalletPaymentIntent({
      amount: 500,
      currency: "USD",
      credits: 200,
      provider: "paystack",
      idemKey: "idem-wallet",
    });

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/wallet/payment-intents");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({
      amount: 500,
      currency: "USD",
      credits: 200,
      provider: "paystack",
      idemKey: "idem-wallet",
    }));
    expect(result.paymentIntent.status).toBe("pending");
  } finally {
    fetchMock.restore();
  }
});
