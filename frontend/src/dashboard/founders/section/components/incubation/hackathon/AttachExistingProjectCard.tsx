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

  useEffect(() => { void Promise.all([fetchFounderProjects(), fetchWorkspaces()]).then(([nextProjects, nextWorkspaces]) => { setProjects(nextProjects); setWorkspaces(nextWorkspaces); }).catch(() => undefined); void fetchAttachedProject(registration.hackathonId, registration.teamId).then((entry) => { if (entry) { setAttached(true); setProjectId(entry.projectId); setWorkspaceId(entry.workspaceId); } }); }, [registration.hackathonId, registration.teamId]);
  const eligible = useMemo(() => projects.filter((project) => project.hasWorkspace), [projects]);
  const workspaceOptions = useMemo(() => workspaces.filter((workspace) => workspace.projectId === projectId), [workspaces, projectId]);

  async function attach() { if (!projectId || !workspaceId) return; setSaving(true); try { const result = await attachExistingProject(registration.hackathonId, registration.teamId, { projectId, workspaceId, consent: true, judgeAccess: { rubric: "summary-and-preview", privateByDefault: true } }); if (!result.ok) throw new Error(result.error || "Project could not be attached."); setAttached(true); toast.success("Existing project attached to this hackathon."); } catch (error) { toast.error(error instanceof Error ? error.message : "Project could not be attached."); } finally { setSaving(false); } }

  return <section className="mb-6 rounded-xl border border-border-default bg-surface-primary p-4"><div className="flex items-start gap-3"><Link2 className="mt-0.5 h-5 w-5 text-accent-primary" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-text-primary">Attach an existing project</h3><p className="mt-1 text-xs text-text-muted">Submit a project you already built without creating a duplicate workspace. Judge access stays private and rubric-scoped.</p>{attached ? <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-status-success">Attached for vetting.</p><Link to={`/workspaces/code?workspace=${encodeURIComponent(workspaceId)}`} className="text-xs font-medium text-accent-primary hover:underline">Open workspace</Link></div> : <div className="mt-3 grid gap-2 sm:grid-cols-2"><select value={projectId} onChange={(event) => { setProjectId(event.target.value); setWorkspaceId(""); }} className="rounded-md border border-border-default bg-background-primary px-3 py-2 text-xs"><option value="">Select a project</option>{eligible.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select><select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} disabled={!projectId} className="rounded-md border border-border-default bg-background-primary px-3 py-2 text-xs"><option value="">Select its workspace</option>{workspaceOptions.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select><button type="button" disabled={!projectId || !workspaceId || saving} onClick={() => void attach()} className="rounded-md bg-accent-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Attaching..." : "Attach for vetting"}</button></div>}</div></div></section>;
}
