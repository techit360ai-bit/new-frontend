import { useParams, Link } from "react-router-dom";
import { Users, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";
import { buildTeamWorkspace } from "@/dashboard/_shared/hackathon/workspace";

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
  const reg = founderProfile.hackathonRegistrations.find((r) => r.teamId === teamId);
  const localWorkspace = founderProfile.teamWorkspaces.find((w) => w.teamId === teamId);
  const ws = localWorkspace ?? (
    reg?.workspaceId
      ? buildTeamWorkspace(reg, reg.workspaceId, reg.registeredAt)
      : undefined
  );

  if (!ws) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Workspace not found</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Generate it from the Build stage.{" "}
            <Link to="/incubation-hub?panel=hackathon&stage=build" className="text-[#0066ff] dark:text-[#58a6ff] font-semibold hover:underline">
              Go to Build
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#0066ff] dark:text-[#58a6ff] uppercase tracking-wider font-bold">Team workspace</p>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">{ws.teamName}</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20c937] bg-[#20c937]/10 border border-[#20c937]/30 rounded-full px-3.5 py-1.5 shadow-[0_2px_10px_rgba(32,201,55,0.1)]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Reported to organizers
        </span>
      </div>

      <section className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff]">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Idea</h2>
        </div>
        {ws.idea ? (
          <dl className="space-y-4">
            {IDEA_FIELDS.map((f) => (
              <div key={f.key} className="border-b border-black/[0.04] dark:border-white/[0.06] pb-3 last:border-b-0 last:pb-0">
                <dt className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{f.label}</dt>
                <dd className="text-sm text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap font-normal leading-relaxed">{ws.idea![f.key]}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Submit your brief to seed the workspace with your idea.</p>
        )}
      </section>

      <section className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff]">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Team</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 rounded-full px-3 py-1.5">
            You · Leader
          </span>
          {ws.team.map((t) => (
            <Link
              key={t.collaboratorId}
              to="/matchresults"
              className="text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] bg-[#0066ff]/10 dark:bg-[#0066ff]/20 border border-[#0066ff]/30 rounded-full px-3 py-1.5 hover:bg-[#0066ff]/20 transition-colors"
            >
              {t.name} · {t.role}
            </Link>
          ))}
        </div>
      </section>

      {reg && reg.checkIns.length > 0 && (
        <section className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3.5">Build timeline</h2>
          <ul className="space-y-2.5">
            {reg.checkIns.map((c) => (
              <li key={c.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <span className="text-[#0066ff] dark:text-[#58a6ff] font-bold mt-0.5">•</span>
                <span>{c.update}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3.5">Artifacts</h2>
        {ws.artifacts ? (
          <div className="flex flex-col gap-2.5">
            {([["Demo", ws.artifacts.demoUrl], ["Deck", ws.artifacts.deckUrl], ["Video", ws.artifacts.videoUrl]] as const).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline break-all"
              >
                {label}: {url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Artifacts appear after final submission.</p>
        )}
      </section>
    </div>
  );
}
