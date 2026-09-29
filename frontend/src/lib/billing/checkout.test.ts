import { beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { createTvceCheckout } from "@/lib/api/tvce";
import {
  NO_PROVIDER,
  checkoutErrorCode,
  describeCheckoutFailure,
  providerForCurrency,
  startCheckout,
} from "./checkout";

vi.mock("@/lib/api/tvce", () => ({ createTvceCheckout: vi.fn() }));

const mockedCheckout = vi.mocked(createTvceCheckout);
const ALL_PROVIDERS = { stripe: true, paystack: true, flutterwave: true };

beforeEach(() => { mockedCheckout.mockReset(); });

describe("providerForCurrency", () => {
  test("prefers local rails for African currencies and international rails otherwise", () => {
    expect(providerForCurrency("NGN", ALL_PROVIDERS)).toBe("paystack");
    expect(providerForCurrency("ngn", ALL_PROVIDERS)).toBe("paystack");
    expect(providerForCurrency("USD", ALL_PROVIDERS)).toBe("stripe");
    expect(providerForCurrency("USD", { stripe: false, paystack: true, flutterwave: false })).toBe("paystack");
    expect(providerForCurrency("USD", NO_PROVIDER)).toBeNull();
  });
});

test("startCheckout redirects to the hosted provider and sends the package reference", async () => {
  mockedCheckout.mockResolvedValue({
    ok: true,
    checkoutUrl: "https://pay.test/session/1",
    paymentIntent: { id: "pay_1", amount: 500, currency: "NGN", credits: 550, status: "pending" },
  });

  const outcome = await startCheckout(
    { packageId: "pack_1", amount: 500, currency: "NGN", credits: 550, name: "Starter" },
    { providers: ALL_PROVIDERS, email: "alice@example.com", origin: "https://app.techit.test" },
  );

  expect(outcome).toEqual({ status: "redirecting", checkoutUrl: "https://pay.test/session/1", provider: "paystack" });
  expect(mockedCheckout).toHaveBeenCalledWith(expect.objectContaining({
    provider: "paystack",
    packageId: "pack_1",
    amount: 500,
    currency: "NGN",
    email: "alice@example.com",
    successUrl: "https://app.techit.test/wallet?checkout=success",
    cancelUrl: "https://app.techit.test/wallet?checkout=cancelled",
  }));
});

test("startCheckout lets the backend resolve a plan without a payable amount", async () => {
  mockedCheckout.mockResolvedValue({
    ok: true,
    checkoutUrl: "https://pay.test/sub/1",
    paymentIntent: { id: "pay_2", amount: 0, currency: "USD", credits: 0, status: "pending" },
  });

  const outcome = await startCheckout(
    { planId: "plan_pro", name: "Pro" },
    { providers: ALL_PROVIDERS, origin: "https://app.techit.test" },
  );

  expect(outcome.status).toBe("redirecting");
  expect(mockedCheckout).toHaveBeenCalledWith(expect.objectContaining({ provider: "stripe", planId: "plan_pro", amount: 0, currency: "" }));
});

test("startCheckout refuses when no provider is enabled", async () => {
  const outcome = await startCheckout({ packageId: "pack_1", amount: 500, currency: "USD" }, { providers: NO_PROVIDER });
  expect(outcome).toEqual({ status: "unavailable", code: "no_provider", message: expect.any(String) });
  expect(mockedCheckout).not.toHaveBeenCalled();
});

test("startCheckout surfaces the backend reason instead of a fake success", async () => {
  mockedCheckout.mockRejectedValue(new ApiError(503, "checkout_redirects_not_configured", { error: "checkout_redirects_not_configured" }));
  const outcome = await startCheckout({ packageId: "pack_1", amount: 500, currency: "USD" }, { providers: ALL_PROVIDERS });
  expect(outcome).toEqual({
    status: "unavailable",
    code: "checkout_redirects_not_configured",
    message: expect.stringContaining("redirects are not configured"),
  });
});

test("describeCheckoutFailure maps auth and unknown failures honestly", () => {
  expect(describeCheckoutFailure(new ApiError(401, "unauthorized")).code).toBe("not_authorized");
  expect(describeCheckoutFailure(new ApiError(402, "payment_required")).code).toBe("payment_required");
  expect(checkoutErrorCode(new Error("boom"))).toBeNull();
  expect(describeCheckoutFailure(new Error("boom")).code).toBe("network_error");
});
