import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Plus, RefreshCw, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrganizationSectionRecord,
  createProgramInvitation,
  fetchOrganizationSection,
  fetchProgramEnrollments,
  type OrganizationLiveRecord,
  type ProgramEnrollment,
} from "@/lib/api/organization";

/**
 * Incubator programs: create a program, invite founders, and monitor the enrolled
 * roster. The invite is real (token → founder notification → accept links the
 * founder's project to the program), and the roster shows each founder's live
 * project stage + milestone progress.
 */
export function Incubator() {
  const [programs, setPrograms] = useState<OrganizationLiveRecord[]>([]);
  const [selected, setSelected] = useState<OrganizationLiveRecord | null>(null);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", cohort: "" });
  const [invite, setInvite] = useState({ email: "", projectId: "" });

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchOrganizationSection("programs");
      setPrograms(rows);
      setSelected((current) => current ?? rows[0] ?? null);
    } catch {
      toast.error("Unable to load programs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPrograms(); }, [loadPrograms]);

  const loadRoster = useCallback(async (programId: string) => {
    try {
      const data = await fetchProgramEnrollments(programId);
      setEnrollments(data.enrollments);
    } catch {
      setEnrollments([]);
    }
  }, []);

  useEffect(() => { if (selected?.id) void loadRoster(selected.id); }, [selected?.id, loadRoster]);

  const createProgram = async () => {
    if (!draft.name.trim()) return toast.error("Program name is required.");
    setCreating(true);
    try {
      const record = await createOrganizationSectionRecord("programs", draft);
      setPrograms((current) => [record, ...current]);
      setSelected(record);
      setDraft({ name: "", description: "", cohort: "" });
      toast.success("Program created.");
    } catch {
      toast.error("Unable to create program.");
    } finally {
      setCreating(false);
    }
  };

  const sendInvite = async () => {
    if (!selected) return;
    if (!invite.email.trim() && !invite.projectId.trim()) return toast.error("Enter a founder email or project id.");
    setInviting(true);
    try {
      await createProgramInvitation(selected.id, {
        email: invite.email.trim() || undefined,
        projectId: invite.projectId.trim() || undefined,
        cohortId: (selected as { cohort?: string }).cohort,
      });
      setInvite({ email: "", projectId: "" });
      toast.success("Invitation sent. The founder can accept it from their notifications.");
      await loadRoster(selected.id);
    } catch {
      toast.error("Unable to send invitation — check the founder email or project id.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Incubator Programs</h1>
          <p className="mt-2 text-muted-foreground">Create programs, invite founders, and monitor enrolled startups.</p>
        </div>
        <button onClick={() => void loadPrograms()} className="inline-flex h-10 w-10 items-center justify-center rounded-md border" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Create program</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label htmlFor="prog-name">Program name</Label><Input id="prog-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label htmlFor="prog-cohort">Cohort</Label><Input id="prog-cohort" value={draft.cohort} onChange={(e) => setDraft({ ...draft, cohort: e.target.value })} /></div>
            <div><Label htmlFor="prog-description">Description</Label><Input id="prog-description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          </div>
          <button disabled={creating} onClick={createProgram} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" />{creating ? "Saving..." : "Add Program"}
          </button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading programs...</p>
          ) : programs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No programs yet.</CardContent></Card>
          ) : programs.map((program) => (
            <button
              key={program.id}
              onClick={() => setSelected(program)}
              className={`w-full rounded-lg border p-4 text-left transition ${selected?.id === program.id ? "border-primary bg-primary/5" : "border-border-default bg-surface-primary hover:bg-background-primary"}`}
            >
              <div className="flex items-center gap-2 font-medium"><GraduationCap className="h-4 w-4" />{String(program.name || program.title || "Program")}</div>
              {program.cohort ? <p className="mt-1 text-xs text-muted-foreground">Cohort {String(program.cohort)}</p> : null}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">Invite founder to {String(selected.name || selected.title || "program")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label htmlFor="invite-email">Founder email</Label><Input id="invite-email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="founder@example.com" /></div>
                    <div><Label htmlFor="invite-project">Project id (optional)</Label><Input id="invite-project" value={invite.projectId} onChange={(e) => setInvite({ ...invite, projectId: e.target.value })} placeholder="project_..." /></div>
                  </div>
                  <button disabled={inviting} onClick={sendInvite} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
                    <UserPlus className="h-4 w-4" />{inviting ? "Sending..." : "Send invite"}
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Enrolled roster</CardTitle></CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">No founders enrolled yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-lg border border-border-default p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{enrollment.project?.title || enrollment.founder?.name || "Founder"}</p>
                              <p className="text-xs text-muted-foreground">{enrollment.founder?.email || enrollment.founderId}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${enrollment.status === "accepted" ? "bg-status-success-soft text-status-success" : "bg-status-warning-soft text-status-warning"}`}>
                              {enrollment.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Stage: {enrollment.project?.stage || "—"}</span>
                            <span>Progress: {enrollment.project?.progress ?? 0}%</span>
                            {enrollment.milestones ? <span>Milestones: {enrollment.milestones.completed}/{enrollment.milestones.total}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Select or create a program to manage it.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
