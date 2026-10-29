// TVCE endpoints live on the BACKEND service (/api/tvce/*), not the ai-router.
// apiUrl() points at the ai-router, so use the generic BACKEND client.
import { platformGet as apiGet, platformPost as apiPost } from '@/lib/platformApi'

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
export function fetchNextBestAction(role?: string) { return apiGet<{ action: string; reason: string; expectedValue: string; access: string; accessStatus?: string; metering: string; usageEstimateRequired: boolean; subscriptionRecommendation: boolean; availableCredits?: number; usageEstimate?: number | null; funding?: string; freeRemaining?: number | null; plan?: string | null; purchaseGuidance?: { relevant: boolean; whyNow: string; expectedOutcome: string; observedPriorUses: number; observedSuccessRate: number | null; recommendedFunding: string } }>(`/tvce/next-best-action${role ? `?role=${encodeURIComponent(role)}` : ''}`) }

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

export type CheckoutProvider = 'stripe' | 'paystack' | 'flutterwave'

/** Booleans only — which hosted checkout providers this deployment can actually reach. */
export interface CheckoutProvidersResponse {
  providers: Record<CheckoutProvider, boolean>
}

export function fetchCheckoutProviders() {
  return apiGet<CheckoutProvidersResponse>('/tvce/checkout/providers')
}
