import { ApiError, getAuthToken } from './client';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
  const text = await response.text(); const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`, body);
  return body as T;
}

export type AcademyProject = { id: string; name: string; stage: string; industry?: string | null; updatedAt?: string | null };
export type AcademyCaseStudy = { company: string; outcome: 'success' | 'failure'; story: string; lesson: string; sourceTitle: string; sourceUrl: string };
export type AcademyModule = { id: string; projectId: string; projectName: string; role: string; phase: string; priority: string; title: string; description: string; objective: string; estimatedHours: number; prerequisites: string[]; tags: string[]; contentVersion: number; status: 'locked' | 'unlocked' | 'in_progress' | 'complete'; minimumEngagementSeconds: number; content: { whyNow: string; overview: string; keyConcepts: string[]; steps: string[]; commonMistakes: string[]; reflection: string; exercise: { title: string; instructions: string }; caseStudies: AcademyCaseStudy[] }; projectApplication?: string | null; coachNotes?: string[]; progress?: { engagementSeconds: number; quizScore: number | null; quizPassed: boolean; exerciseReviewStatus: string | null; exerciseReviewFeedback: string | null; startedAt: string | null; completedAt: string | null; reflectionSubmitted: boolean } | null; assessment: Array<{ id: string; question: string; options: string[] }> };
export type AcademyCurriculum = { id: string; projectId: string; projectName: string; role: string; stage: string; version: number; estimatedHours: number; estimatedWeeks: number; modules: AcademyModule[]; nextModuleId: string | null; progress: { completed: number; total: number }; policy: Record<string, unknown> };
export type AcademyBadge = { id: string; badgeId?: string; projectId?: string; role?: string; earnedAt?: string };
export const getAcademyProjects = (role: string) => request<{ ok: boolean; projects: AcademyProject[] }>(`/academy/projects?role=${encodeURIComponent(role)}`);
export const getAcademyCurriculum = (projectId: string) => request<{ ok: boolean; curriculum: AcademyCurriculum }>(`/academy/curriculum?projectId=${encodeURIComponent(projectId)}`);
export const getAcademyBadges = () => request<{ ok: boolean; badges: AcademyBadge[] }>('/academy/badges');
export const triggerAcademyAdaptation = (projectId: string, triggerEvent: string) => request<{ ok: boolean; curriculum: AcademyCurriculum }>(`/academy/adapt`, { method: 'POST', body: JSON.stringify({ projectId, triggerEvent }) });
export const startAcademyModule = (curriculumId: string, moduleId: string) => request<{ ok: boolean; sessionId: string }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/start`, { method: 'POST', body: '{}' });
export const heartbeatAcademyModule = (curriculumId: string, moduleId: string, sessionId: string) => request<{ ok: boolean; engagementSeconds: number }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/heartbeat`, { method: 'POST', body: JSON.stringify({ sessionId }) });
export const saveAcademyReflection = (curriculumId: string, moduleId: string, text: string) => request<{ ok: boolean }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/reflection`, { method: 'POST', body: JSON.stringify({ text }) });
export const scoreAcademyQuiz = (curriculumId: string, moduleId: string, answers: number[]) => request<{ ok: boolean; score: number; passed: boolean }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) });
export const submitAcademyExercise = (curriculumId: string, moduleId: string, submission: string) => request<{ ok: boolean; reviewStatus: string; score?: number; feedback?: string }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/exercise`, { method: 'POST', body: JSON.stringify({ submission }) });
export const completeAcademyModule = (curriculumId: string, moduleId: string) => request<{ ok: boolean; error?: string; requirements?: Record<string, unknown> }>(`/academy/curricula/${encodeURIComponent(curriculumId)}/modules/${encodeURIComponent(moduleId)}/complete`, { method: 'POST', body: '{}' });
