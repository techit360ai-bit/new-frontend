import { useEffect, useState } from "react";
import { LiveCollectionPage } from "./LiveCollectionPage";
import { fetchOrganizationTalentRecommendations } from "@/lib/api/recommendationIntelligence";

export function TalentPool() {
  const [recommendations, setRecommendations] = useState<Array<{ person?: { id: string; name: string; title?: string; skills?: string[] }; score: number; reasons: string[] }>>([]);
  useEffect(() => { fetchOrganizationTalentRecommendations({ limit: 8 }).then((result) => setRecommendations(result.recommendations as typeof recommendations)).catch(() => setRecommendations([])); }, []);
  return <div className="space-y-4">
    {recommendations.length > 0 && <section className="rounded-lg border border-border-default bg-surface-primary p-4"><h2 className="text-sm font-semibold text-text-primary">Recommended talent for current organization needs</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{recommendations.map((row) => <div key={String(row.person?.id)} className="rounded border border-border-subtle p-3"><div className="flex items-center justify-between"><span className="font-medium text-text-primary">{row.person?.name || "Talent candidate"}</span><span className="text-xs text-brand-accent">{Math.round(row.score)}%</span></div><p className="mt-1 text-xs text-text-muted">{row.person?.title || "Contributor"} · {(row.person?.skills || []).slice(0, 4).join(", ")}</p><p className="mt-2 text-xs text-text-secondary">{row.reasons.join(" · ")}</p></div>)}</div></section>}
    <LiveCollectionPage section="talent" title="Talent Pool" description="Manage live talent records available to your organization." itemLabel="Talent record" fields={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "skills", label: "Skills" }, { key: "location", label: "Location" }, { key: "notes", label: "Notes", multiline: true }]} />
  </div>;
}
