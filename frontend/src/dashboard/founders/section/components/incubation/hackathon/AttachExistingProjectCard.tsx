import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { fetchFounderProjects, type FounderProject } from "@/lib/api/projects";
import { fetchWorkspaces, type WorkspaceRef } from "@/lib/api/workspaces";
import { attachExistingProject, fetchAttachedProject } from "@/lib/api/hackathon";
import type { HackathonRegistration } from "@/contexts/UserContext";

export function AttachExistingProjectCard({ registration }: { registration: HackathonRegistration }) {
  const [projects, setProjects] = useState<FounderProject[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([]);
  const [projectId, setProjectId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [attached, setAttached] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void Promise.all([fetchFounderProjects(), fetchWorkspaces()]).then(([nextProjects, nextWorkspaces]) => { setProjects(nextProjects); setWorkspaces(nextWorkspaces); }).catch(() => undefined); void fetchAttachedProject(registration.hackathonId, registration.teamId).then((entry: { projectId: string; workspaceId?: string } | null) => { if (entry) { setAttached(true); setProjectId(entry.projectId); setWorkspaceId(entry.workspaceId || ""); } }); }, [registration.hackathonId, registration.teamId]);

  const eligible = useMemo(() => projects.filter((project) => project.hasWorkspace), [projects]);
  const workspaceOptions = useMemo(() => workspaces.filter((workspace) => workspace.projectId === projectId), [workspaces, projectId]);

  async function attach() { if (!projectId || !workspaceId) return; setSaving(true); try { const result = await attachExistingProject(registration.hackathonId, registration.teamId, { projectId, workspaceId, consent: true, judgeAccess: { rubric: "summary-and-preview", privateByDefault: true } }); if (!result.ok) throw new Error(result.error || "Project could not be attached."); setAttached(true); toast.success("Existing project attached to this hackathon."); } catch (error) { toast.error(error instanceof Error ? error.message : "Project could not be attached."); } finally { setSaving(false); } }

  return (
    <section className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl">
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
          <Link2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bricolage text-sm font-bold text-slate-100">Attach an existing project</h3>
          <p className="mt-1 text-xs text-slate-400">Submit a project you already built without creating a duplicate workspace. Judge access stays private and rubric-scoped.</p>
          {attached ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2">
              <p className="text-xs font-semibold text-emerald-400">Attached for vetting.</p>
              <Link to={`/workspaces/code?workspace=${encodeURIComponent(workspaceId)}`} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Open workspace</Link>
            </div>
          ) : (
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setWorkspaceId(""); }} className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none">
                <option value="">Select a project</option>
                {eligible.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
              <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} disabled={!projectId} className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none disabled:opacity-50">
                <option value="">Select its workspace</option>
                {workspaceOptions.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
              </select>
              <button type="button" disabled={!projectId || !workspaceId || saving} onClick={() => void attach()} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 sm:col-span-2">
                {saving ? "Attaching..." : "Attach for vetting"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
