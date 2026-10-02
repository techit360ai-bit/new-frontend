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
      <div className="absolute inset-0 bg-background-inverse/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-surface-primary rounded-xl shadow-xl p-6" role="dialog" aria-label="Promote to startup">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Promote to startup</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-secondary" aria-label="Close">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">Create a venture from this hackathon project. It joins your portfolio and reuses your team workspace.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 bg-surface-primary focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border border-border-strong text-text-secondary hover:bg-background-primary">Cancel</button>
          <button type="button" disabled={!canCreate || creating} onClick={() => { void handleConfirm(); }}
            className={`text-sm font-medium px-4 py-2 rounded-lg ${canCreate ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-surface-secondary text-text-disabled cursor-not-allowed"}`}>
            {creating ? "Creating..." : "Create startup"}
          </button>
        </div>
      </div>
    </div>
  );
}
