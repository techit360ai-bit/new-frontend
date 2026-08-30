import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicCustomerValidation, submitPublicCustomerValidation, type CustomerValidationSession } from "@/lib/api/incubation";

export default function PublicValidation() {
  const { token = "" } = useParams();
  const [session, setSession] = useState<CustomerValidationSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetchPublicCustomerValidation(token).then(setSession).catch((cause) => setError(cause instanceof Error ? cause.message : "Validation link unavailable")); }, [token]);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); try { await submitPublicCustomerValidation(token, answers); setSubmitted(true); } catch (cause) { setError(cause instanceof Error ? cause.message : "Response could not be recorded"); } };
  if (error) return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><p className="rounded-xl border p-5 text-sm text-text-secondary">{error}</p></main>;
  if (!session) return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><p className="text-sm text-text-muted">Loading validation…</p></main>;
  if (submitted) return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><div className="w-full rounded-xl border p-6 text-center"><h1 className="text-xl font-semibold">Thank you</h1><p className="mt-2 text-sm text-text-muted">Your response has been recorded.</p></div></main>;
  return <main className="min-h-screen bg-background-primary p-4 sm:p-8"><form onSubmit={submit} className="mx-auto max-w-xl space-y-5 rounded-2xl border bg-surface-primary p-5 shadow-sm sm:p-8"><div><h1 className="text-2xl font-semibold text-text-primary">{session.title}</h1><p className="mt-2 text-sm text-text-muted">{session.description || "Share your real experience. No account is required."}</p><p className="mt-2 text-xs text-text-muted">Your answers are recorded as anonymous evidence.</p></div>{session.questions.map((question) => <label key={question.id} className="block space-y-2"><span className="text-sm font-medium text-text-primary">{question.question}{question.required !== false && " *"}</span><textarea required={question.required !== false} value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="min-h-28 w-full rounded-lg border p-3 text-sm" /></label>)}{error && <p className="text-sm text-status-error">{error}</p>}<button className="min-h-12 w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Submit response</button></form></main>;
}
