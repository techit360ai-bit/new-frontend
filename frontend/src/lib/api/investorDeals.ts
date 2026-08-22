import { apiGet, apiPatch, apiPost } from "./client";

export type DealState = "interest" | "intro_requested" | "access_pending" | "diligence_open" | "diligence_complete" | "ic_review" | "term_sheet" | "negotiation" | "closing" | "closed" | "passed" | "withdrawn" | "expired";
export interface DiligenceItem { id: string; category: string; title: string; status: string; priority: string; ownerId?: string | null; dueDate?: string | null; comments?: string; }
export interface DealRoom { id: string; projectId: string; investorId: string; founderId?: string | null; state: DealState; ndaSigned: boolean; ndaRequired: boolean; participantRole: string | null; diligence: { total: number; completed: number }; }
export interface DealRoomDetail { ok: boolean; deal: DealRoom; checklist: DiligenceItem[]; questions: Array<Record<string, unknown>>; notes: Array<Record<string, unknown>>; ic: Array<Record<string, unknown>>; }
export const listInvestorDeals = () => apiGet<{ deals: DealRoom[] }>("/investor-deals");
export const createInvestorDeal = (projectId: string, founderId?: string) => apiPost<{ deal: DealRoom }>("/investor-deals", { projectId, founderId });
export const getInvestorDeal = (dealId: string) => apiGet<DealRoomDetail>(`/investor-deals/${encodeURIComponent(dealId)}`);
export const signDealNda = (dealId: string) => apiPost<{ deal: DealRoom }>(`/investor-deals/${encodeURIComponent(dealId)}/nda/sign`, { accepted: true });
export const transitionInvestorDeal = (dealId: string, state: DealState) => apiPost<{ deal: DealRoom }>(`/investor-deals/${encodeURIComponent(dealId)}/status`, { state });
export const updateDiligenceItem = (dealId: string, itemId: string, input: Record<string, unknown>) => apiPatch<{ item: DiligenceItem }>(`/investor-deals/${encodeURIComponent(dealId)}/checklist/${encodeURIComponent(itemId)}`, input);
export const createDealQuestion = (dealId: string, content: string, visibility?: string) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/questions`, { content, visibility });
export const createDealInternalNote = (dealId: string, content: string) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/internal-notes`, { content });
export const createDealIcReview = (dealId: string, input: Record<string, unknown>) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/ic`, input);
export const createDealTermSheet = (dealId: string, terms: Record<string, unknown>) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/term-sheet`, { terms });
