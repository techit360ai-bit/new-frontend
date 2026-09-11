import { apiGet, apiPost } from '@/lib/api/client'

export interface TvceDecision {
  allowed: boolean
  paywall?: boolean
  code: string
  capability: string
  role?: string
  availableCredits?: number
  recommendedAction?: string
  recommendation?: string
  usageEstimateRequired?: boolean
  value?: { title?: string; outcomes?: string[]; workflowStage?: string }
  accountEntitlement?: { active: boolean; source?: string | null; status?: string }
  subscription?: { active: boolean; plan?: string | null; status?: string }
  organizationEntitlement?: { plan?: string; source?: string; status?: string; expiresAt?: string | null; limits?: Record<string, number> | null }
  organizationDecision?: { allowed?: boolean; code?: string; capacity?: { used?: number; limit?: number | null; remaining?: number | null } }
}

export function evaluatePaywall(input: Record<string, unknown>) {
  return apiPost<TvceDecision>('/tvce/paywall/evaluate', input)
}

export interface OrganizationTvceEntitlements {
  organizationId: string | null
  entitlements: TvceDecision[]
}

export function fetchOrganizationEntitlements(organizationId: string) {
  return apiGet<OrganizationTvceEntitlements>(`/tvce/entitlements?organizationId=${encodeURIComponent(organizationId)}`)
}

export function saveWorkflow(input: Record<string, unknown>) {
  return apiPost<{ workflow: { id: string } }>('/tvce/workflow', input)
}

export function forecastWallet() {
  return apiGet<{ availableCredits: number; projectedRequirement: number; shortfall: number; covered: boolean }>('/tvce/wallet/forecast')
}

export interface TvceProgress { meter: { ideaClarity: number; validation: number; executionReadiness: number; investorReadiness: number }; strongestOpportunity: string; generatedAt: string }
export function fetchProgress() { return apiGet<TvceProgress>('/tvce/progress') }
export interface TvceFreeUsage { capability: string; used: number; quota: number; remaining: number; period: string }
export function fetchFreeUsage() { return apiGet<{ usage: TvceFreeUsage[] }>('/tvce/free-usage') }
export function fetchFunnel(period = '30d') { return apiGet<{ stages: Array<{ stage: string; count: number }>; totalEvents: number; capabilities: string[] }>(`/tvce/analytics/funnel?period=${encodeURIComponent(period)}`) }
export function fetchNextBestAction(role?: string) { return apiGet<{ action: string; reason: string; expectedValue: string; access: string; metering: string; usageEstimateRequired: boolean; subscriptionRecommendation: boolean }>(`/tvce/next-best-action${role ? `?role=${encodeURIComponent(role)}` : ''}`) }

export interface AdminTvceAnalytics {
  generatedAt: string
  period: string
  metrics: {
    successfulPayments: number
    totalRevenue: number
    creditRevenue: number
    subscriptionRevenue: number
    paidAccounts: number
    creditBuyers: number
    activeSubscriptions: number
    webhookProcessed: number
    webhookFailures: number
    usageEvents: number
    usageCogsUsd: number
    usageRevenueUsd: number
    usageGrossProfitUsd: number
    usageGrossMargin: number | null
    marginWarnings: number
    marginCritical: number
    aiTokenSpend: {
      inputTokens: number
      outputTokens: number
      cachedInputTokens: number
      totalTokens: number
      creditsSettled: number
      providerCostUsd: number
      infrastructureCostUsd: number
      totalVariableCostUsd: number
      freeCapabilityUses: number
    }
    wallet: {
      grossCredits: number
      reservedCredits: number
      availableCredits: number
      activeSubscriptionAccounts: number
    }
  }
  providerModelBreakdown: Array<{
    provider: string
    model: string
    calls: number
    inputTokens: number
    outputTokens: number
    cachedInputTokens: number
    totalTokens: number
    providerCostUsd: number
    totalVariableCostUsd: number
    credits: number
    revenueUsd: number
  }>
  funnel?: Array<{ stage: string; count: number }>
  drilldown?: { usage?: Array<Record<string, unknown>> }
}

export function fetchAdminTvceAnalytics(period = '30d') {
  return apiGet<AdminTvceAnalytics>(`/admin/tvce/analytics?period=${encodeURIComponent(period)}`)
}

export function fulfillPayment(paymentId: string, input: { verified: boolean; providerReference?: string; workflowId?: string }) {
  return apiPost(`/tvce/payments/${encodeURIComponent(paymentId)}/fulfill`, input)
}

export interface TvceCheckoutRequest {
  provider: 'stripe' | 'paystack' | 'flutterwave'
  packageId?: string
  planId?: string
  amount: number
  currency: string
  credits?: number
  name?: string
  email?: string
  successUrl?: string
  cancelUrl?: string
  workflowId?: string
  idemKey?: string
}

export interface TvceCheckoutResponse {
  ok: boolean
  checkoutUrl?: string
  provider?: string
  paymentIntent: { id: string; amount: number; currency: string; credits: number; status: string; provider?: string | null; checkoutUrl?: string | null }
}

export function createTvceCheckout(input: TvceCheckoutRequest) {
  return apiPost<TvceCheckoutResponse>('/tvce/checkout/session', input)
}
