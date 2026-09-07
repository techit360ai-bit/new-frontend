import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { promoteDefaults } from "@/dashboard/_shared/hackathon/promote";
import { createFounderProject } from "@/lib/api/projects";
import { useGenerateTeamWorkspace } from "./useGenerateTeamWorkspace";

interface Props {
  registration: HackathonRegistration;
  onClose: () => void;
}

const STAGES = ["idea", "mvp", "beta", "launch", "growth"];

export function PromoteToStartupModal({ registration, onClose }: Props) {
  const { founderProfile, addFounderProject, bindTeamWorkspaceProject, updateHackathonRegistration } = useFounderProfile();
  const generate = useGenerateTeamWorkspace();
  const defaults = promoteDefaults(registration, founderProfile);
  const [title, setTitle] = useState(defaults.title);
  const [tagline, setTagline] = useState(defaults.tagline);
  const [industry, setIndustry] = useState(defaults.industry);
  const [stage, setStage] = useState(defaults.stage);

  const canCreate = title.trim().length > 0;

  const [creating, setCreating] = useState(false);

  const handleConfirm = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const result = await createFounderProject({
        title: title.trim(),
        tagline: tagline.trim(),
        industry: industry.trim(),
        stage,
        hackathonId: registration.hackathonId,
        teamId: registration.teamId,
      });
      if (!result.ok || !result.project) {
        toast.error(result.error || "The startup was not persisted.");
        return;
      }
      const workspaceId = registration.workspaceId ?? await generate(registration, { navigateAfter: false });
      if (!workspaceId) return;
      addFounderProject(result.project);
      bindTeamWorkspaceProject(workspaceId, result.project.id);
      updateHackathonRegistration(registration.teamId, { promotedProjectId: result.project.id });
      toast.success("Promoted to startup — added to your ventures");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The startup could not be created.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/10 rounded-2xl shadow-2xl p-6" role="dialog" aria-label="Promote to startup">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Promote to startup</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Create a venture from this hackathon project. It joins your portfolio and reuses your team workspace.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-all">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-black/[0.06] dark:border-white/10">
          <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">Cancel</button>
          <button type="button" disabled={!canCreate || creating} onClick={() => { void handleConfirm(); }}
            className={`text-sm font-bold px-4 py-2.5 rounded-xl transition-all ${canCreate ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]" : "bg-slate-100 dark:bg-white/[0.05] text-slate-400 cursor-not-allowed"}`}>
            {creating ? "Creating..." : "Create startup"}
          </button>
        </div>
      </div>
    </div>
  );
}
