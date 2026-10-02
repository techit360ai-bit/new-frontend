import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  createCollaboratorTask,
  fetchCollaboratorTasks,
  patchCollaboratorTask,
  type CollaboratorTask,
  type CollaboratorTaskPriority,
  type CollaboratorTaskProject,
} from "@/lib/api/collaboratorTasks";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type SortKey = "impact" | "deadline" | "project";
type Priority = CollaboratorTaskPriority;

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

function daysUntil(deadlineIso: string): number {
  const due = new Date(deadlineIso);
  const today = new Date();
  if (Number.isNaN(due.getTime())) return Number.POSITIVE_INFINITY;
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function deadlineTime(deadlineIso: string): number {
  const time = new Date(deadlineIso).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function priorityPillClass(p: Priority): string {
  switch (p) {
    case "critical": return "bg-status-error-soft text-status-error";
    case "high":     return "bg-status-warning-soft text-status-warning";
    case "medium":   return "bg-surface-secondary text-text-secondary";
    case "low":      return "bg-surface-secondary text-text-muted";
  }
}

export function Tasks() {
  const navigate = useNavigate();
  const [taskList, setTaskList]   = useState<CollaboratorTask[]>([]);
  const [projects, setProjects] = useState<CollaboratorTaskProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortKey, setSortKey]     = useState<SortKey>("impact");
  const [completedOpen, setCompletedOpen] = useState(false);
  const [addOpen, setAddOpen]     = useState(false);

  const [nfProject,   setNfProject]   = useState<string>(projects[0]?.id ?? "");
  const [nfTitle,     setNfTitle]     = useState("");
  const [nfDue,       setNfDue]       = useState("");
  const [nfPriority,  setNfPriority]  = useState<Priority>("medium");
  const [nfImpact,    setNfImpact]    = useState(50);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchCollaboratorTasks();
      setProjects(snapshot.projects);
      setTaskList(snapshot.tasks);
    } catch (err) {
      setProjects([]);
      setTaskList([]);
      setError(err instanceof Error ? err.message : "Live collaborator tasks are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!nfProject && projects[0]) setNfProject(projects[0].id);
  }, [nfProject, projects]);

  const filtered = useMemo(() => {
    let list = taskList;
    if (projectFilter !== "all") list = list.filter((t) => t.projectId === projectFilter);
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "impact") return b.impactScore - a.impactScore;
      if (sortKey === "deadline") return deadlineTime(a.deadline) - deadlineTime(b.deadline);
      return a.projectName.localeCompare(b.projectName);
    });
    return sorted;
  }, [taskList, projectFilter, sortKey]);

  const open      = filtered.filter((t) => t.status !== "completed");
  const completed = filtered.filter((t) => t.status === "completed");

  const today    = open.filter((t) => daysUntil(t.deadline) <= 1);
  const thisWeek = open.filter((t) => { const d = daysUntil(t.deadline); return d > 1 && d <= 7; });
  const later    = open.filter((t) => daysUntil(t.deadline) > 7);

  const counts = {
    open: open.length,
    critical: open.filter((t) => t.priority === "critical").length,
    dueThisWeek: thisWeek.length + today.length,
  };

  const handleComplete = async (id: string) => {
    const task = taskList.find((t) => t.id === id);
    if (!task) return;
    try {
      const updated = await patchCollaboratorTask(task, { status: "completed" });
      setTaskList((cur) => cur.map((t) => t.id === id ? updated : t));
      toast("Marked complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update task.");
    }
  };
  const handleWorkspace = (projectId: string) => navigate(`/workspaces/build?startup=${projectId}`);
  const handleSnooze = async (id: string, deadline: string) => {
    const task = taskList.find((t) => t.id === id);
    if (!task) return;
    const d = new Date(deadline);
    const nextDate = Number.isNaN(d.getTime()) ? new Date() : d;
    nextDate.setDate(nextDate.getDate() + 1);
    const next = nextDate.toISOString().slice(0, 10);
    try {
      const updated = await patchCollaboratorTask(task, { deadline: next });
      setTaskList((cur) => cur.map((t) => t.id === id ? updated : t));
      toast(`Snoozed to ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update task.");
    }
  };

  const resetForm = () => {
    setNfTitle(""); setNfDue(""); setNfPriority("medium"); setNfImpact(50);
    setNfProject(projects[0]?.id ?? "");
  };
  const canSubmit = Boolean(nfTitle.trim() && nfDue && nfProject);

  const handleAdd = async () => {
    if (!canSubmit) return;
    const proj = projects.find((p) => p.id === nfProject);
    if (!proj) return;
    setSaving(true);
    try {
      const newTask = await createCollaboratorTask({
        workspaceId: proj.workspaceId,
        projectId: proj.id,
        projectName: proj.name,
        title: nfTitle.trim(),
        priority: nfPriority,
        deadline: nfDue,
        impactScore: nfImpact,
      });
      setTaskList((cur) => [newTask, ...cur]);
      toast("Task added");
      setAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading ? "Loading live task assignments..." : `${counts.open} open · ${counts.critical} critical · ${counts.dueThisWeek} due this week`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 border border-border-strong rounded-lg px-3 text-sm bg-surface-primary">
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 border border-border-strong rounded-lg px-3 text-sm bg-surface-primary">
            <option value="impact">Sort: Impact</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="project">Sort: Project</option>
          </select>
          <button onClick={() => setAddOpen(true)}
            disabled={loading || projects.length === 0}
            className="h-9 px-3 bg-status-warning hover:bg-amber-400 text-text-primary rounded-lg text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add task
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-status-error bg-status-error-soft rounded-xl p-4">
          <p className="text-sm font-semibold text-status-error">Live tasks are unavailable.</p>
          <p className="text-sm text-status-error mt-1">{error}</p>
          <button onClick={() => void loadTasks()}
            className="mt-3 text-xs px-3 py-1.5 border border-status-error rounded-lg text-status-error hover:bg-status-error-soft">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && taskList.length === 0 && (
        <div className="border border-dashed border-border-strong bg-surface-primary rounded-xl p-5 text-sm text-text-muted">
          No live task assignments yet. Workspace tasks will appear here when assigned.
        </div>
      )}

      {!loading && !error && (
        <>
          <Section title="Today" rows={today} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="Nothing due today." />
          <Section title="This week" rows={thisWeek} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="Nothing due this week." />
          <Section title="Later" rows={later} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="No upcoming tasks." />

          <div className="border border-border-default bg-surface-primary rounded-xl">
            <button onClick={() => setCompletedOpen((v) => !v)}
              className="w-full p-4 text-left text-sm font-semibold text-text-secondary flex items-center justify-between">
              <span>Completed ({completed.length})</span>
              <span className="text-text-disabled">{completedOpen ? "Hide" : "Show"}</span>
            </button>
            {completedOpen && (
              <ul className="border-t border-border-subtle divide-y divide-slate-100">
                {completed.length === 0 && <li className="p-4 text-sm text-text-muted">No completed tasks yet.</li>}
                {completed.map((t) => (
                  <li key={t.id} className="p-4 text-sm text-text-muted line-through">{t.title}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Project</label>
              <select value={nfProject} onChange={(e) => setNfProject(e.target.value)}
                className="w-full h-10 border border-border-strong rounded-lg px-3 text-sm bg-surface-primary">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Title</label>
              <input value={nfTitle} onChange={(e) => setNfTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full h-10 border border-border-strong rounded-lg px-3 text-sm focus:outline-none focus:border-status-warning" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Due date</label>
              <input type="date" value={nfDue} onChange={(e) => setNfDue(e.target.value)}
                className="w-full h-10 border border-border-strong rounded-lg px-3 text-sm focus:outline-none focus:border-status-warning" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => setNfPriority(p)}
                    className={`h-9 rounded-lg border-2 text-xs font-medium ${nfPriority === p ? "border-status-warning bg-status-warning-soft text-status-warning" : "border-border-strong bg-surface-primary text-text-muted"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Impact ({nfImpact})</label>
              <input type="range" min={0} max={100} value={nfImpact} onChange={(e) => setNfImpact(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm rounded-lg text-text-secondary hover:bg-surface-secondary">Cancel</button>
            <button onClick={() => void handleAdd()} disabled={!canSubmit || saving}
              className="px-4 py-2 text-sm rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400 disabled:bg-slate-200 disabled:text-text-disabled">{saving ? "Adding..." : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title, rows, onComplete, onWorkspace, onSnooze, priorityPillClass, emptyText,
}: {
  title: string;
  rows: CollaboratorTask[];
  onComplete: (id: string) => Promise<void>;
  onWorkspace: (projectId: string) => void;
  onSnooze: (id: string, deadline: string) => Promise<void>;
  priorityPillClass: (p: Priority) => string;
  emptyText: string;
}) {
  return (
    <div className="border border-border-default bg-surface-primary rounded-xl">
      <div className="px-5 py-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-secondary">{title} ({rows.length})</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-text-muted">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((t) => (
            <li key={t.id} className="p-4 flex items-start gap-3">
              <input type="checkbox" checked={false} readOnly className="mt-1 accent-amber-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-text-primary">{t.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityPillClass(t.priority)}`}>{t.priority}</span>
                </div>
                <p className="text-xs text-text-muted">{t.projectName} · Impact {t.impactScore} · Due {t.deadline || "No deadline"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => void onComplete(t.id)} className="text-xs px-3 py-1.5 border border-border-strong rounded-lg hover:bg-background-primary">Mark complete</button>
                <button onClick={() => onWorkspace(t.projectId)} className="text-xs px-3 py-1.5 bg-background-inverse text-white rounded-lg hover:bg-surface-inverse-muted">Open in workspace</button>
                <button onClick={() => void onSnooze(t.id, t.deadline)} className="text-xs px-3 py-1.5 border border-border-strong rounded-lg hover:bg-background-primary">Snooze 1d</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
