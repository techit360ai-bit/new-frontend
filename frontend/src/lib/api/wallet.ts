// frontend/src/lib/api/wallet.ts
//
// Wallet, credits, plans, invoices, and payment intents from BACKEND /api/domain/wallet/*.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface WalletSummary {
  account: Record<string, unknown>;
  creditBalance: number;
  wallets?: WalletBucket[];
  deductionOrder?: string[];
  lowBalance?: boolean;
  expirationAlerts?: WalletExpirationAlert[];
  sourceTotals?: Record<string, number>;
  subscriptionUsage?: SubscriptionUsage;
  freePlan?: FreePlanInfo;
  restriction?: WalletRestriction | null;
  consumedThisPeriod?: number;
  lifetimeCreditsUsed: number;
  pendingPayments: number;
}

export interface WalletBucket { id: string; label: string; balance: number; limit: number; usagePercent: number; expiresAt?: string | null; status: string; description: string; }
export interface WalletExpirationAlert { walletId: string; message: string; expiresAt: string; }
export interface SubscriptionUsage { included: number; consumed: number; remaining: number; renewalAt?: string | null; effectiveValue?: string; }
export interface FreePlanInfo { welcomeCredits: number; monthlyCredits: number; eligibleTasks: string[]; restrictions: string[]; upgradeReason?: string | null; }
export interface WalletRestriction { reason: string; currentPlan?: string; missingCapability?: string; creditsRequired?: number; recommendedPlan?: string; benefits?: string[]; }
export interface WalletAnalytics {
  period: string;
  points: Array<{ label: string; credits: number; displayPercent: number; walletSource: string; walletLabel?: string }>;
  sourceTotals: Record<string, number>;
  sourceLabels?: Record<string, string>;
  totalConsumed?: number;
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
  walletUsed?: string;
  walletType?: string;
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
  bonusCredits?: number;
  checkoutUrl?: string;
  country?: string;
  discountLabel?: string;
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

export interface WalletSubscription {
  id: string;
  planId?: string;
  planName?: string;
  status?: string;
  amount?: number;
  currency?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface WalletInvoice {
  id: string;
  number?: string;
  invoiceNumber?: string;
  amount?: number;
  total?: number;
  currency?: string;
  status?: string;
  issuedAt?: string;
  dueAt?: string;
  createdAt?: string;
  invoiceUrl?: string;
  downloadUrl?: string;
  receiptUrl?: string;
  [key: string]: unknown;
}

export interface PaymentIntentRequest {
  packageId?: string;
  amount?: number;
  currency?: string;
  credits?: number;
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
    checkoutUrl?: string | null;
  };
}

export const EMPTY_WALLET_SUMMARY: WalletSummary = {
  account: {},
  creditBalance: 0,
  wallets: [], deductionOrder: [], lowBalance: false, expirationAlerts: [], sourceTotals: {},
  subscriptionUsage: { included: 0, consumed: 0, remaining: 0 }, freePlan: { welcomeCredits: 0, monthlyCredits: 0, eligibleTasks: [], restrictions: [] }, restriction: null,
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

export function fetchWalletAnalytics(period: "daily" | "weekly" | "monthly"): Promise<WalletAnalytics> {
  return domainGet<WalletAnalytics>(`/wallet/analytics?period=${period}`);
}

export function fetchCreditPackages(): Promise<CreditPackage[]> {
  return domainGet<{ creditPackages: CreditPackage[] }>("/wallet/credit-packages").then((data) => data.creditPackages);
}

export function fetchBillingPlans(): Promise<BillingPlan[]> {
  return domainGet<{ plans: BillingPlan[] }>("/wallet/plans").then((data) => data.plans);
}

export function fetchWalletSubscriptions(): Promise<WalletSubscription[]> {
  return domainGet<{ subscriptions: WalletSubscription[] }>("/wallet/subscriptions")
    .then((data) => data.subscriptions);
}

export function fetchWalletInvoices(): Promise<WalletInvoice[]> {
  return domainGet<{ invoices: WalletInvoice[] }>("/wallet/invoices")
    .then((data) => data.invoices);
}

export function createWalletPaymentIntent(body: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  return domainPost<PaymentIntentResponse>("/wallet/payment-intents", body);
}
