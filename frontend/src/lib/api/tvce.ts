import { apiGet, apiPost } from '@/lib/api/client'

export interface TvceDecision {
  allowed: boolean
  paywall?: boolean
  code: string
  capability: string
  role?: string
  availableCredits?: number
  requiredCredits?: number
  minimumRoleCredits?: number
  recommendedAction?: string
  recommendation?: string
  estimatedAdditionalCredits?: number
  value?: { title?: string; outcomes?: string[]; workflowStage?: string }
  accountEntitlement?: { active: boolean; source?: string | null; status?: string }
  subscription?: { active: boolean; plan?: string | null; status?: string }
}

export function evaluatePaywall(input: Record<string, unknown>) {
  return apiPost<TvceDecision>('/tvce/paywall/evaluate', input)
}

export function saveWorkflow(input: Record<string, unknown>) {
  return apiPost<{ workflow: { id: string } }>('/tvce/workflow', input)
}

export function forecastWallet() {
  return apiGet<{ availableCredits: number; projectedRequirement: number; shortfall: number; covered: boolean }>('/tvce/wallet/forecast')
}

export interface TvceProgress { meter: { ideaClarity: number; validation: number; executionReadiness: number; investorReadiness: number }; strongestOpportunity: string; generatedAt: string }
export function fetchProgress() { return apiGet<TvceProgress>('/tvce/progress') }
export function fetchFunnel(period = '30d') { return apiGet<{ stages: Array<{ stage: string; count: number }>; totalEvents: number; capabilities: string[] }>(`/tvce/analytics/funnel?period=${encodeURIComponent(period)}`) }
export function fetchNextBestAction(role?: string) { return apiGet<{ action: string; reason: string; expectedValue: string; access: string; creditCost: number; subscriptionRecommendation: boolean }>(`/tvce/next-best-action${role ? `?role=${encodeURIComponent(role)}` : ''}`) }

export function fulfillPayment(paymentId: string, input: { verified: boolean; providerReference?: string; workflowId?: string }) {
  return apiPost(`/tvce/payments/${encodeURIComponent(paymentId)}/fulfill`, input)
}
