import { apiGet, apiPatch, apiPost, apiPut } from "./client";

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
export const getDealDocuments = (dealId: string) => apiGet<{ documents: Array<Record<string, unknown>> }>(`/investor-deals/${encodeURIComponent(dealId)}/documents`);
export const createDealDocument = (dealId: string, input: Record<string, unknown>) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/documents`, input);
export const finalizeDealDocument = (dealId: string, documentId: string) => apiPost(`/investor-deals/${encodeURIComponent(dealId)}/documents/${encodeURIComponent(documentId)}/finalize`);
export const downloadDealDocument = (dealId: string, documentId: string) => apiGet<{ downloadUrl: string | null }>(`/investor-deals/${encodeURIComponent(dealId)}/documents/${encodeURIComponent(documentId)}/download`);
export const getDealQuestionnaire = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/questionnaire`);
export const saveDealQuestionnaire = (dealId: string, answers: Record<string, unknown>, submit = false) => apiPut(`/investor-deals/${encodeURIComponent(dealId)}/questionnaire`, { answers, submit });
export const getTechnicalDd = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/technical-dd`);
export const getRevenueVerification = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/revenue`);
export const getDealReferences = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/references`);
export const getDealTeam = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/team`);
export const updateDealIc = (dealId: string, input: Record<string, unknown>) => apiPut(`/investor-deals/${encodeURIComponent(dealId)}/ic`, input);
export const generateInvestorPack = (dealId: string) => apiPost<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/pack`);
export const getClosingReadiness = (dealId: string) => apiGet<Record<string, unknown>>(`/investor-deals/${encodeURIComponent(dealId)}/closing`);
