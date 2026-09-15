import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, CheckCircle2, Clock, Calendar, CheckSquare, Layers, Sparkles, Filter, AlertCircle, ArrowUpRight } from "lucide-react";
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
    case "critical": return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
    case "high":     return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    case "medium":   return "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20";
    case "low":      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sprint Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {loading ? "Loading live task assignments..." : (
              <span className="flex items-center gap-2">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">{counts.open} open</span>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">{counts.critical} critical</span>
                <span>•</span>
                <span>{counts.dueThisWeek} due this week</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs font-semibold bg-white/80 dark:bg-[#111111] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997] shadow-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs font-semibold bg-white/80 dark:bg-[#111111] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997] shadow-sm"
          >
            <option value="impact">Sort: Impact Score</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="project">Sort: Project</option>
          </select>

          <button
            onClick={() => setAddOpen(true)}
            disabled={loading || projects.length === 0}
            className="h-10 px-4 bg-[#20C997] hover:bg-[#1db587] text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Live tasks are unavailable.</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={() => void loadTasks()}
            className="mt-3 text-xs px-3.5 py-1.5 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && taskList.length === 0 && (
        <div className="border border-dashed border-slate-300 dark:border-white/10 bg-white/50 dark:bg-[#111111]/50 backdrop-blur-xl rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
          No live task assignments yet. Workspace tasks will appear here when assigned.
        </div>
      )}

      {!loading && !error && (
        <>
          <Section title="Today" icon={<Clock className="w-4 h-4 text-amber-500" />} rows={today} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="Nothing due today." />
          <Section title="This Week" icon={<Calendar className="w-4 h-4 text-[#20C997]" />} rows={thisWeek} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="Nothing due this week." />
          <Section title="Later" icon={<Layers className="w-4 h-4 text-purple-500" />} rows={later} onComplete={handleComplete} onWorkspace={handleWorkspace} onSnooze={handleSnooze} priorityPillClass={priorityPillClass} emptyText="No upcoming tasks." />

          <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setCompletedOpen((v) => !v)}
              className="w-full p-4 px-5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#20C997]" />
                <span>Completed ({completed.length})</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{completedOpen ? "Hide" : "Show"}</span>
            </button>
            {completedOpen && (
              <ul className="border-t border-black/[0.06] dark:border-white/10 divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {completed.length === 0 && <li className="p-4 px-5 text-xs text-slate-500 dark:text-slate-400 italic">No completed tasks yet.</li>}
                {completed.map((t) => (
                  <li key={t.id} className="p-3.5 px-5 text-xs text-slate-400 dark:text-slate-500 line-through flex items-center justify-between">
                    <span>{t.title}</span>
                    <span className="text-[10px] uppercase font-semibold">{t.projectName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#111111]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Create Contributor Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Project</label>
              <select
                value={nfProject}
                onChange={(e) => setNfProject(e.target.value)}
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              >
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
              <input
                value={nfTitle}
                onChange={(e) => setNfTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={nfDue}
                onChange={(e) => setNfDue(e.target.value)}
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNfPriority(p)}
                    className={`h-9 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                      nfPriority === p
                        ? "border-[#20C997] bg-[#20C997]/10 text-[#20C997]"
                        : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Impact Score</label>
                <span className="text-xs font-extrabold text-[#20C997]">{nfImpact}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={nfImpact}
                onChange={(e) => setNfImpact(Number(e.target.value))}
                className="w-full accent-[#20C997]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleAdd()}
              disabled={!canSubmit || saving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 shadow-sm disabled:opacity-50 transition-all"
            >
              {saving ? "Adding..." : "Add Task"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title, icon, rows, onComplete, onWorkspace, onSnooze, priorityPillClass, emptyText,
}: {
  title: string;
  icon?: React.ReactNode;
  rows: CollaboratorTask[];
  onComplete: (id: string) => Promise<void>;
  onWorkspace: (projectId: string) => void;
  onSnooze: (id: string, deadline: string) => Promise<void>;
  priorityPillClass: (p: Priority) => string;
  emptyText: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{title}</h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300">
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-xs text-slate-500 dark:text-slate-400 italic">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {rows.map((t) => (
            <li key={t.id} className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => void onComplete(t.id)}
                  className="mt-0.5 w-4 h-4 rounded border border-slate-300 dark:border-white/20 hover:border-[#20C997] flex items-center justify-center shrink-0 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-transparent hover:text-[#20C997]" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityPillClass(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t.projectName}</span>
                    <span>•</span>
                    <span>Impact {t.impactScore}</span>
                    <span>•</span>
                    <span>Due {t.deadline || "No deadline"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => void onComplete(t.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => onWorkspace(t.projectId)}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-1"
                >
                  <span>Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void onSnooze(t.id, t.deadline)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  +1d
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
