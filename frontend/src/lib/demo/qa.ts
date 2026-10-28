// Demo Q&A client — talks to the Go messaging service /api/v1/demos/{id}/questions.
// All calls are offline-safe via withFallback so the panel renders without a backend.
import { msgGet, msgPost, withFallback } from "@/lib/messaging/client";

export type QuestionState = "open" | "answered" | "dismissed";

export interface Question {
  id: string;
  eventId: string;
  askerId: string;
  body: string;
  state: QuestionState | string;
  votes: number;
  mine: boolean;
  createdAt: string;
}

export function listQuestions(eventId: string): Promise<Question[]> {
  return withFallback(
    async () => (await msgGet<{ questions: Question[] }>(`/demos/${encodeURIComponent(eventId)}/questions`)).questions ?? [],
    () => [],
    "list questions",
  );
}

export function askQuestion(eventId: string, body: string): Promise<Question | null> {
  return withFallback(
    () => msgPost<Question>(`/demos/${encodeURIComponent(eventId)}/questions`, { body }),
    () => null,
    "ask question",
  );
}

export interface VoteResult { questionId: string; votes: number; mine: boolean }

export function upvoteQuestion(eventId: string, qid: string): Promise<VoteResult | null> {
  return withFallback(
    () => msgPost<VoteResult>(`/demos/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(qid)}/upvote`),
    () => null,
    "upvote question",
  );
}

export function resolveQuestion(eventId: string, qid: string, state: QuestionState): Promise<Question | null> {
  return withFallback(
    () => msgPost<Question>(`/demos/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(qid)}/resolve`, { state }),
    () => null,
    "resolve question",
  );
}
