import { domainGet, domainPost, domainDelete } from "@/lib/domainApi";

export interface DecayStatus {
  factor: number;
  level: "healthy" | "warning" | "critical";
  message: string | null;
}

export interface ResumeItem {
  type: string;
  description: string;
  nextStep: string;
  actionUrl: string | null;
  cta: string;
}

export interface DoNowAction {
  action: string;
  reason: string;
  timeEstimate: string;
  credits: number;
  url: string;
}

export interface NewEvent {
  type: string;
  description: string;
  url: string;
}

export interface WeeklyPriority {
  goal: string;
  deadline: string;
  velocityContext: string;
}

export interface SessionContext {
  greeting: string;
  awayMessage: string | null;
  decayStatus: DecayStatus | null;
  currentState: string;
  gsisScore: number;
  resume: ResumeItem[];
  doNow: DoNowAction | null;
  newSinceLeft: NewEvent[];
  weeklyPriority: WeeklyPriority | null;
}

export async function fetchSessionContext(): Promise<SessionContext> {
  const data = await domainGet<Partial<SessionContext>>("/context/session");
  return {
    greeting: data.greeting || "Welcome back",
    awayMessage: data.awayMessage ?? null,
    decayStatus: data.decayStatus ?? null,
    currentState: data.currentState || "",
    gsisScore: Number(data.gsisScore) || 0,
    resume: Array.isArray(data.resume) ? data.resume : [],
    doNow: data.doNow ?? null,
    newSinceLeft: Array.isArray(data.newSinceLeft) ? data.newSinceLeft : [],
    weeklyPriority: data.weeklyPriority ?? null,
  };
}

export async function createCheckpoint(data: {
  checkpointType: string;
  referenceId: string;
  description: string;
  nextStep: string;
  actionUrl?: string;
  cta?: string;
}): Promise<{ ok: boolean }> {
  return domainPost<{ ok: boolean }>("/context/checkpoint", data);
}

export async function clearCheckpoint(type: string, referenceId: string): Promise<{ ok: boolean }> {
  return domainDelete<{ ok: boolean }>(`/context/checkpoint/${type}/${referenceId}`);
}
