// frontend/src/lib/billing/checkout.ts
//
// Single place that turns a credit pack or subscription plan into a real hosted
// checkout session. The wallet calls this instead of creating a local
// placeholder payment intent, so "Buy credits" and "Upgrade" either redirect to
// a provider-hosted page or report exactly why they cannot.

import { ApiError } from "@/lib/api/client";
import { createTvceCheckout, type CheckoutProvider } from "@/lib/api/tvce";

export type ProviderAvailability = Record<CheckoutProvider, boolean>;

export const NO_PROVIDER: ProviderAvailability = { stripe: false, paystack: false, flutterwave: false };

/** Providers that settle in local African currencies get first refusal there. */
const LOCAL_RAIL_CURRENCIES = new Set(["NGN", "GHS", "KES", "ZAR", "EGP"]);
const PROVIDER_ORDER_INTERNATIONAL: CheckoutProvider[] = ["stripe", "paystack", "flutterwave"];
const PROVIDER_ORDER_LOCAL: CheckoutProvider[] = ["paystack", "flutterwave", "stripe"];

const PROVIDER_LABEL: Record<CheckoutProvider, string> = {
  stripe: "Stripe",
  paystack: "Paystack",
  flutterwave: "Flutterwave",
};

const ERROR_MESSAGES: Record<string, string> = {
  unsupported_provider: "No payment provider is enabled for this deployment yet. Please try again later.",
  checkout_redirects_not_configured: "Checkout redirects are not configured for this deployment yet. Please try again later.",
  stripe_not_configured: "Stripe is not configured for this deployment yet.",
  paystack_not_configured: "Paystack is not configured for this deployment yet.",
  flutterwave_not_configured: "Flutterwave is not configured for this deployment yet.",
  credit_package_not_found: "That credit pack is no longer available. Refresh the wallet and try again.",
  billing_plan_not_found: "That plan is no longer available. Refresh the wallet and try again.",
  package_id_or_plan_id_required: "This item is missing its package or plan reference.",
  stripe_checkout_failed: "Stripe rejected the checkout session. Nothing was charged.",
  paystack_checkout_failed: "Paystack rejected the checkout session. Nothing was charged.",
  flutterwave_checkout_failed: "Flutterwave rejected the checkout session. Nothing was charged.",
};

export function providerLabel(provider: CheckoutProvider): string {
  return PROVIDER_LABEL[provider];
}

export function hasAnyProvider(providers: ProviderAvailability): boolean {
  return providers.stripe || providers.paystack || providers.flutterwave;
}

export function providerForCurrency(
  currency: string | undefined | null,
  providers: ProviderAvailability,
): CheckoutProvider | null {
  const normalized = String(currency ?? "").trim().toUpperCase();
  const order = LOCAL_RAIL_CURRENCIES.has(normalized) ? PROVIDER_ORDER_LOCAL : PROVIDER_ORDER_INTERNATIONAL;
  return order.find((provider) => providers[provider]) ?? null;
}

export interface CheckoutTarget {
  packageId?: string;
  planId?: string;
  amount?: number;
  currency?: string;
  credits?: number;
  name?: string;
}

export type CheckoutOutcome =
  | { status: "redirecting"; checkoutUrl: string; provider: CheckoutProvider }
  | { status: "unavailable"; code: string; message: string };

export interface StartCheckoutOptions {
  providers: ProviderAvailability;
  email?: string;
  origin?: string;
}

export function checkoutErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body as { error?: unknown } | null;
  if (body && typeof body.error === "string") return body.error;
  return `http_${error.status}`;
}

export function describeCheckoutFailure(error: unknown): { code: string; message: string } {
  const code = checkoutErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return { code, message: ERROR_MESSAGES[code] };
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return { code: "not_authorized", message: "Sign in again to continue to checkout." };
  }
  if (error instanceof ApiError && error.status === 402) {
    return { code: "payment_required", message: "Payment was not accepted. Nothing was charged." };
  }
  if (code) return { code, message: `Checkout could not start (${code}). Nothing was charged.` };
  return { code: "network_error", message: "Checkout could not start. Check your connection and try again." };
}

export function checkoutRedirectUrls(origin: string): { successUrl: string; cancelUrl: string } {
  const base = `${origin.replace(/\/+$/, "")}/wallet`;
  return { successUrl: `${base}?checkout=success`, cancelUrl: `${base}?checkout=cancelled` };
}

export async function startCheckout(
  target: CheckoutTarget,
  options: StartCheckoutOptions,
): Promise<CheckoutOutcome> {
  const currency = target.currency;
  const amount = Number(target.amount ?? 0);
  // A package or plan id lets the backend resolve the authoritative amount and
  // currency, so only id-less targets must already carry a payable amount.
  const identifiable = Boolean(target.packageId || target.planId);
  if (!identifiable && (!Number.isFinite(amount) || amount <= 0 || !currency)) {
    return {
      status: "unavailable",
      code: "amount_unavailable",
      message: "This item has no payable amount and currency yet.",
    };
  }
  const provider = providerForCurrency(currency, options.providers);
  if (!provider) {
    return {
      status: "unavailable",
      code: "no_provider",
      message: "No payment provider is enabled for this deployment yet. Please try again later.",
    };
  }
  const origin = options.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const { successUrl, cancelUrl } = checkoutRedirectUrls(origin);
  const reference = target.packageId ? `pack-${target.packageId}` : `plan-${target.planId}`;
  try {
    const result = await createTvceCheckout({
      provider,
      amount: Number.isFinite(amount) ? amount : 0,
      currency: currency ?? "",
      credits: target.credits,
      name: target.name,
      packageId: target.packageId,
      planId: target.planId,
      email: options.email,
      successUrl,
      cancelUrl,
      idemKey: `${reference}-${provider}-${String(currency).toUpperCase()}`,
    });
    const checkoutUrl = result.checkoutUrl || result.paymentIntent?.checkoutUrl || "";
    if (!result.ok || !checkoutUrl) {
      return {
        status: "unavailable",
        code: "no_checkout_url",
        message: "The payment provider did not return a hosted checkout page. Nothing was charged.",
      };
    }
    return { status: "redirecting", checkoutUrl, provider };
  } catch (error) {
    const failure = describeCheckoutFailure(error);
    return { status: "unavailable", code: failure.code, message: failure.message };
  }
}
