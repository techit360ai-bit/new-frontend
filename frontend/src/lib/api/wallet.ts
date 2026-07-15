// frontend/src/lib/api/wallet.ts
//
// Wallet, credits, plans, invoices, and payment intents from BACKEND /api/domain/wallet/*.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface WalletSummary {
  account: Record<string, unknown>;
  creditBalance: number;
  lifetimeCreditsUsed: number;
  pendingPayments: number;
}

export interface WalletUsageEvent {
  id: string;
  title?: string;
  description?: string;
  credits?: number;
  createdAt?: string;
  timestamp?: string;
  feature?: string;
  [key: string]: unknown;
}

export interface WalletTransaction {
  id: string;
  title?: string;
  description?: string;
  credits?: number;
  deltaCredits?: number;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price?: string;
  priceNGN?: string;
  priceUSD?: string;
  usdPrice?: string;
  popular?: boolean;
  amount?: number;
  currency?: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  priceNGN?: string;
  priceUSD?: string;
  credits?: string;
  popular?: boolean;
  features?: string[];
  amount?: number;
  currency?: string;
}

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  credits: number;
  provider?: string;
  idemKey?: string;
}

export interface PaymentIntentResponse {
  paymentIntent: {
    id: string;
    amount: number;
    currency: string;
    credits: number;
    status: string;
    provider?: string | null;
  };
}

export const EMPTY_WALLET_SUMMARY: WalletSummary = {
  account: {},
  creditBalance: 0,
  lifetimeCreditsUsed: 0,
  pendingPayments: 0,
};

export function fetchWalletSummary(): Promise<WalletSummary> {
  return domainGet<WalletSummary>("/wallet/summary");
}

export function fetchWalletUsage(): Promise<WalletUsageEvent[]> {
  return domainGet<{ usage: WalletUsageEvent[] }>("/wallet/usage").then((data) => data.usage);
}

export function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  return domainGet<{ transactions: WalletTransaction[] }>("/wallet/transactions").then((data) => data.transactions);
}

export function fetchCreditPackages(): Promise<CreditPackage[]> {
  return domainGet<{ creditPackages: CreditPackage[] }>("/wallet/credit-packages").then((data) => data.creditPackages);
}

export function fetchBillingPlans(): Promise<BillingPlan[]> {
  return domainGet<{ plans: BillingPlan[] }>("/wallet/plans").then((data) => data.plans);
}

export function createWalletPaymentIntent(body: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  return domainPost<PaymentIntentResponse>("/wallet/payment-intents", body);
}
