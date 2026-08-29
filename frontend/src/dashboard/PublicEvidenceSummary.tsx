import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "@/lib/api/config";

export default function PublicEvidenceSummary() {
  const { token = "" } = useParams();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch(apiUrl(`/validate/evidence/${encodeURIComponent(token)}`)).then(async (response) => { if (!response.ok) throw new Error("Evidence summary unavailable"); return response.json(); }).then(setReport).catch((cause) => setError(cause instanceof Error ? cause.message : "Evidence summary unavailable")); }, [token]);
  if (error) return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><p className="rounded-xl border p-5 text-sm">{error}</p></main>;
  if (!report) return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><p className="text-sm text-slate-500">Loading evidence summary…</p></main>;
  const findings = (report.findings || {}) as Record<string, unknown>;
  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><article className="mx-auto max-w-2xl space-y-5 rounded-2xl border bg-white p-6 shadow-sm"><div><p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Verified Customer Evidence</p><h1 className="mt-2 text-2xl font-semibold">{String(report.title || "Customer Validation")}</h1><p className="mt-2 text-sm text-slate-600">{String(report.methodology || "Immutable TechIT-recorded customer evidence")}</p></div><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><span className="text-slate-500">Responses</span><strong className="block">{String(report.totalResponses || 0)}</strong></div><div><span className="text-slate-500">Qualified</span><strong className="block">{String(report.qualifiedResponses || 0)}</strong></div><div><span className="text-slate-500">Confidence</span><strong className="block capitalize">{String(report.confidence || "insufficient")}</strong></div><div><span className="text-slate-500">Objective</span><strong className="block">{String(report.objective || "")}</strong></div></div><section><h2 className="font-semibold">What Customers Are Telling You</h2><ul className="mt-2 space-y-2 text-sm text-slate-700">{(Array.isArray(findings.whatWeLearned) ? findings.whatWeLearned : []).map((item) => <li key={String(item)}>{String(item)}</li>)}</ul></section></article></main>;
}
