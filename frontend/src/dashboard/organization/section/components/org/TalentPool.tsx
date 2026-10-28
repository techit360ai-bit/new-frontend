import { useEffect, useState } from "react";
import { LiveCollectionPage } from "./LiveCollectionPage";
import { fetchOrganizationTalentRecommendations } from "@/lib/api/recommendationIntelligence";

export function TalentPool() {
  const [recommendations, setRecommendations] = useState<Array<{ person?: { id: string; name: string; title?: string; skills?: string[] }; score: number; reasons: string[] }>>([]);
  useEffect(() => {
    fetchOrganizationTalentRecommendations({ limit: 8 })
      .then((result) => setRecommendations((result.recommendations || []) as typeof recommendations))
      .catch(() => setRecommendations([]));
  }, []);

  return (
    <div className="space-y-6">
      {recommendations.length > 0 && (
        <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommended Talent for Organization Needs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Matched against current incubator projects, open roles, and talent gaps.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations.map((row) => (
              <div key={String(row.person?.id)} className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{row.person?.name || "Talent candidate"}</span>
                  <span className="text-xs font-black text-[#0066ff] bg-[#0066ff]/10 px-2.5 py-0.5 rounded-full border border-[#0066ff]/20">{Math.round(row.score)}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.person?.title || "Contributor"} &middot; {(row.person?.skills || []).slice(0, 4).join(", ")}</p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">{row.reasons.join(" &middot; ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <LiveCollectionPage section="talent" title="Talent Pool" description="Manage live talent records available to your organization." itemLabel="Talent record" fields={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "skills", label: "Skills" }, { key: "location", label: "Location" }, { key: "notes", label: "Notes", multiline: true }]} />
    </div>
  );
}
