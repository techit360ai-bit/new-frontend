import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "@/lib/api/config";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export default function PublicEvidenceSummary() {
  const { token = "" } = useParams();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/validate/evidence/${encodeURIComponent(token)}`))
      .then(async (response) => {
        if (!response.ok) throw new Error("Evidence summary unavailable");
        return response.json();
      })
      .then(setReport)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Evidence summary unavailable"));
  }, [token]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center p-6 text-slate-900 dark:text-white">
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-600 dark:text-red-400 w-full text-center">
          {error}
        </p>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6 text-slate-500 dark:text-slate-400">
        <p className="text-sm font-medium">Loading evidence summary…</p>
      </main>
    );
  }

  const findings = (report.findings || {}) as Record<string, unknown>;
  const whatWeLearned = Array.isArray(findings.whatWeLearned) ? findings.whatWeLearned : [];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#121212] p-4 sm:p-8 text-slate-900 dark:text-white">
      <article className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0066ff] dark:text-[#58a6ff]">
            <ShieldCheck className="h-4 w-4" />
            Verified Customer Evidence
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {String(report.title || "Customer Validation")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {String(report.methodology || "Immutable TechIT-recorded customer evidence")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Responses</span>
            <strong className="block text-base font-bold text-slate-900 dark:text-white mt-0.5">{String(report.totalResponses || 0)}</strong>
          </div>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Qualified</span>
            <strong className="block text-base font-bold text-slate-900 dark:text-white mt-0.5">{String(report.qualifiedResponses || 0)}</strong>
          </div>
          <div className="rounded-xl border border-[#20c937]/20 bg-[#20c937]/10 p-3.5">
            <span className="text-xs text-[#20c937] font-semibold">Confidence</span>
            <strong className="block text-base font-bold capitalize text-[#20c937] mt-0.5">{String(report.confidence || "insufficient")}</strong>
          </div>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Objective</span>
            <strong className="block text-base font-bold text-slate-900 dark:text-white mt-0.5">{String(report.objective || "—")}</strong>
          </div>
        </div>

        {whatWeLearned.length > 0 && (
          <section className="pt-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">What Customers Are Telling You</h2>
            <ul className="space-y-2.5">
              {whatWeLearned.map((item) => (
                <li key={String(item)} className="flex items-start gap-2.5 rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#20c937] mt-0.5" />
                  <span>{String(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
