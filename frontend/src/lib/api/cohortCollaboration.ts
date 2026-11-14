import { apiGet, apiPost } from './client';

export interface CohortSummary {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  status: string;
  memberCount: number;
  classesCount: number;
  upcomingClassesCount: number;
  assignmentsCount: number;
  lastMessage?: CohortMessage | null;
}

export interface CohortMember {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  startupName?: string;
}

export interface CohortClass {
  id: string;
  cohortId: string;
  organizationId: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  instructor: string;
  meetingUrl: string;
  status: 'scheduled' | 'live' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface CohortMessage {
  id: string;
  cohortId: string;
  organizationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string | null;
  type: string;
  text: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CohortAssignment {
  id: string;
  cohortId: string;
  organizationId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  resources?: string[];
  submissionCount?: number;
  mySubmission?: CohortSubmission | null;
  status?: 'pending' | 'submitted' | 'reviewed' | 'overdue';
  createdAt: string;
}

export interface CohortSubmission {
  id: string;
  assignmentId: string;
  cohortId: string;
  organizationId: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string | null;
  content: string;
  link?: string | null;
  fileUrl?: string | null;
  status: 'submitted' | 'reviewed';
  grade?: number | null;
  feedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface CohortBroadcast {
  id: string;
  cohortId: string;
  organizationId: string;
  senderId: string;
  senderName: string;
  title: string;
  message: string;
  channel: string;
  recipientCount: number;
  createdAt: string;
}

export interface CohortHubData {
  cohort: {
    id: string;
    name: string;
    organizationId: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  };
  isOrgLead: boolean;
  members: CohortMember[];
  classes: CohortClass[];
  assignments: CohortAssignment[];
  recentMessages: CohortMessage[];
  recentBroadcasts: CohortBroadcast[];
}

export async function fetchMyCohorts(): Promise<CohortSummary[]> {
  const res = await apiGet<{ ok: boolean; cohorts: CohortSummary[] }>('/organization-intelligence/cohorts/my-cohorts');
  return res.cohorts || [];
}

export async function fetchOrgCohorts(organizationId?: string): Promise<Array<{ id: string; name: string; status: string }>> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const res = await apiGet<Array<{ id: string; name: string; status: string }>>(`/organization-intelligence/cohorts${query}`);
  return Array.isArray(res) ? res : [];
}

export async function fetchCohortHub(cohortId: string): Promise<CohortHubData> {
  return apiGet<CohortHubData>(`/organization-intelligence/cohorts/${cohortId}/hub`);
}

export async function scheduleCohortLiveClass(cohortId: string, input: {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  instructor?: string;
  meetingUrl?: string;
}): Promise<{ ok: boolean; liveClass: CohortClass }> {
  return apiPost<{ ok: boolean; liveClass: CohortClass }>(`/organization-intelligence/cohorts/${cohortId}/classes`, input);
}

export async function sendCohortInMailBroadcast(cohortId: string, input: {
  title: string;
  message: string;
  channel?: 'all' | 'email' | 'in_app';
}): Promise<{ ok: boolean; broadcast: CohortBroadcast }> {
  return apiPost<{ ok: boolean; broadcast: CohortBroadcast }>(`/organization-intelligence/cohorts/${cohortId}/in-mail`, input);
}

export async function fetchCohortMessages(cohortId: string): Promise<{ messages: CohortMessage[]; members: CohortMember[] }> {
  const res = await apiGet<{ ok: boolean; messages: CohortMessage[]; members: CohortMember[] }>(`/organization-intelligence/cohorts/${cohortId}/messages`);
  return { messages: res.messages || [], members: res.members || [] };
}

export async function sendCohortChatMessage(cohortId: string, input: {
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
}): Promise<{ ok: boolean; message: CohortMessage }> {
  return apiPost<{ ok: boolean; message: CohortMessage }>(`/organization-intelligence/cohorts/${cohortId}/messages`, input);
}

export async function createCohortAssignment(cohortId: string, input: {
  title: string;
  description: string;
  dueDate: string;
  points?: number;
}): Promise<{ ok: boolean; assignment: CohortAssignment }> {
  return apiPost<{ ok: boolean; assignment: CohortAssignment }>(`/organization-intelligence/cohorts/${cohortId}/assignments`, input);
}

export async function submitCohortAssignment(cohortId: string, assignmentId: string, input: {
  content?: string;
  link?: string;
  fileUrl?: string;
}): Promise<{ ok: boolean; submission: CohortSubmission }> {
  return apiPost<{ ok: boolean; submission: CohortSubmission }>(`/organization-intelligence/cohorts/${cohortId}/assignments/${assignmentId}/submit`, input);
}

export async function fetchCohortSubmissions(cohortId: string, assignmentId: string): Promise<{ assignment: CohortAssignment; submissions: CohortSubmission[] }> {
  return apiGet<{ assignment: CohortAssignment; submissions: CohortSubmission[] }>(`/organization-intelligence/cohorts/${cohortId}/assignments/${assignmentId}/submissions`);
}
