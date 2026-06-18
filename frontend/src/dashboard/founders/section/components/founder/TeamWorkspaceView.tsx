import { useParams, Link } from "react-router-dom";
import { Users, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";

const IDEA_FIELDS: { key: "problem" | "targetUser" | "solutionSketch" | "whyNow" | "differentiator" | "risk" | "successMetric"; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "targetUser", label: "Target user" },
  { key: "solutionSketch", label: "Solution sketch" },
  { key: "whyNow", label: "Why now" },
  { key: "differentiator", label: "Differentiator" },
  { key: "risk", label: "Biggest risk" },
  { key: "successMetric", label: "Success metric" },
];

export function TeamWorkspaceView() {
  const { teamId } = useParams();
  const { founderProfile } = useFounderProfile();
  const ws = founderProfile.teamWorkspaces.find((w) => w.teamId === teamId);
  const reg = founderProfile.hackathonRegistrations.find((r) => r.teamId === teamId);

  if (!ws) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="border border-slate-200 bg-white rounded-xl p-12 text-center">
          <h1 className="text-base font-semibold text-slate-700 mb-2">Workspace not found</h1>
          <p className="text-sm text-slate-500">
            Generate it from the Build stage.{" "}
            <Link to="/incubation-hub?panel=hackathon&stage=build" className="text-violet-600 hover:underline">Go to Build</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Team workspace</p>
          <h1 className="text-2xl font-bold text-slate-900">{ws.teamName}</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Reported to organizers
        </span>
      </div>

      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Idea</h2>
        </div>
        {ws.idea ? (
          <dl className="space-y-3">
            {IDEA_FIELDS.map((f) => (
              <div key={f.key}>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">{f.label}</dt>
                <dd className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap">{ws.idea![f.key]}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Submit your brief to seed the workspace with your idea.</p>
        )}
      </section>

      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Team</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">You · Leader</span>
          {ws.team.map((t) => (
            <Link key={t.collaboratorId} to="/matchresults" className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 hover:bg-violet-100">
              {t.name} · {t.role}
            </Link>
          ))}
        </div>
      </section>

      {reg && reg.checkIns.length > 0 && (
        <section className="border border-slate-200 bg-white rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Build timeline</h2>
          <ul className="space-y-2">
            {reg.checkIns.map((c) => (
              <li key={c.id} className="text-sm text-slate-700 flex gap-2">
                <span className="text-slate-300">•</span><span>{c.update}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Artifacts</h2>
        {ws.artifacts ? (
          <div className="flex flex-col gap-2">
            {([["Demo", ws.artifacts.demoUrl], ["Deck", ws.artifacts.deckUrl], ["Video", ws.artifacts.videoUrl]] as const).map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 break-all">
                {label}: {url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Artifacts appear after final submission.</p>
        )}
      </section>
    </div>
  );
}
