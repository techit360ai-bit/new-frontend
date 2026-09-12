import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  Filter,
  FolderKanban,
  Pencil,
  Plus,
  Rocket,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createOrganizationProject,
  fetchOrganizationProjects,
  updateOrganizationProject,
  type OrganizationProject,
  type OrganizationProjectInput,
} from "@/lib/api/organization";

const PIPELINE_STAGES = [
  { value: "idea", label: "Idea" },
  { value: "validation", label: "Validation" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
  { value: "market-ready", label: "Market Ready" },
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "on-track", label: "On Track" },
  { value: "at-risk", label: "At Risk" },
  { value: "completed", label: "Completed" },
];

interface ProjectForm {
  title: string;
  tagline: string;
  industry: string;
  stage: string;
  status: string;
  progress: string;
  teamName: string;
}

const EMPTY_FORM: ProjectForm = {
  title: "",
  tagline: "",
  industry: "",
  stage: "idea",
  status: "planned",
  progress: "0",
  teamName: "",
};

function normalizedStage(value: string): string {
  const stage = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (["mvp", "prototype", "build"].includes(stage)) return "development";
  if (["launch", "launched", "growth", "marketready"].includes(stage)) return "market-ready";
  return stage;
}

function labelFor(value: string, fallback: string): string {
  if (!value.trim()) return fallback;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timestampLabel(value: string): string {
  if (!value) return "No persisted update";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusStyle(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("risk") || value.includes("blocked")) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }
  if (value.includes("complete") || value.includes("done")) {
    return "border-[#20C997]/30 bg-[#20C997]/10 text-[#20C997]";
  }
  if (value.includes("track") || value.includes("active")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  return "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300";
}

function formFromProject(project: OrganizationProject): ProjectForm {
  return {
    title: project.title,
    tagline: project.tagline,
    industry: project.industry,
    stage: normalizedStage(project.stage) || "idea",
    status: project.status || "planned",
    progress: String(project.progress),
    teamName: project.teamName,
  };
}

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<OrganizationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<OrganizationProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchOrganizationProjects());
    } catch (loadError) {
      setProjects([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Organization projects are unavailable.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        [project.title, project.tagline, project.industry, project.teamName]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStage =
        stageFilter === "all" || normalizedStage(project.stage) === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [projects, search, stageFilter]);

  const stats = useMemo(() => {
    const marketReady = projects.filter((project) =>
      normalizedStage(project.stage) === "market-ready" ||
      project.status.toLowerCase().includes("complete")
    ).length;
    const atRisk = projects.filter((project) =>
      project.status.toLowerCase().includes("risk") ||
      project.status.toLowerCase().includes("blocked")
    ).length;
    return {
      total: projects.length,
      inProgress: Math.max(0, projects.length - marketReady),
      marketReady,
      atRisk,
    };
  }, [projects]);

  const openCreate = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (project: OrganizationProject) => {
    setEditingProject(project);
    setForm(formFromProject(project));
    setFormError(null);
    setDialogOpen(true);
  };

  const submitProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title || saving) {
      if (!title) setFormError("Project title is required.");
      return;
    }

    const input: OrganizationProjectInput = {
      title,
      tagline: form.tagline.trim(),
      industry: form.industry.trim(),
      stage: form.stage,
      status: form.status,
      progress: Number(form.progress) || 0,
      teamName: form.teamName.trim(),
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editingProject) {
        const updated = await updateOrganizationProject(editingProject.id, input);
        setProjects((current) =>
          current.map((project) => project.id === updated.id ? updated : project),
        );
        setNotice(`${updated.title} was updated.`);
      } else {
        const created = await createOrganizationProject(input);
        setProjects((current) => [created, ...current]);
        setNotice(`${created.title} was created.`);
      }
      setDialogOpen(false);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : "The project could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Projects Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Create, track, and scale your persisted innovation portfolio
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-5 text-xs font-bold text-slate-950 transition-all shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Create Project
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="hover:underline text-emerald-700 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Projects" value={stats.total} icon={TrendingUp} tone="mint" />
        <MetricCard label="In Progress" value={stats.inProgress} icon={Clock} tone="orange" />
        <MetricCard label="Market Ready" value={stats.marketReady} icon={Rocket} tone="green" />
        <MetricCard label="At Risk" value={stats.atRisk} icon={AlertCircle} tone="red" />
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search persisted projects..."
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
            />
          </div>
          <div className="relative min-w-52">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] pl-9 pr-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
            >
              <option value="all">All stages</option>
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Project Pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.value} className="rounded-xl border border-[#20C997]/30 bg-[#20C997]/10 px-4 py-3 text-center">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{stage.label}</p>
              <p className="mt-1 text-xs font-black font-mono text-[#20C997]">
                {projects.filter((project) => normalizedStage(project.stage) === stage.value).length}
                {" "}projects
              </p>
            </div>
          ))}
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading persisted projects...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-red-500" />
          <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-10 text-center">
          <FolderKanban className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {projects.length === 0 ? "No persisted projects yet" : "No projects match these filters"}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {projects.length === 0
              ? "Create the first organization project to start tracking the portfolio."
              : "Adjust the search or stage filter to see other projects."}
          </p>
          {projects.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredProjects.length > 0 && (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{project.title}</h3>
                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {[project.industry, project.teamName || "No assigned team"]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {project.tagline && (
                        <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">{project.tagline}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(project)}
                      title={`Edit ${project.title}`}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-0.5 text-[11px] font-bold ${statusStyle(project.status)}`}>
                      {labelFor(project.status, "Planned")}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {labelFor(project.stage, "Idea")}
                    </span>
                    {project.aiLevel && (
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        AI: {project.aiLevel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div className="h-full rounded-full bg-[#20C997]" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{project.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Market Ready</p>
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {project.marketReadyScore > 0 ? `${project.marketReadyScore}/100` : "Not scored"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Team Size</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Users className="h-3.5 w-3.5 text-[#20C997]" />
                        {project.memberCount}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Last Update</p>
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                        {timestampLabel(project.updatedAt || project.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 lg:w-40 lg:flex-col">
                  <button
                    type="button"
                    disabled={!project.hasWorkspace}
                    onClick={() => navigate("/workspaces")}
                    className="flex-1 rounded-xl bg-[#20C997]/10 border border-[#20C997]/20 px-4 py-2 text-xs font-bold text-[#20C997] hover:bg-[#20C997]/20 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-white/5 disabled:text-slate-400 disabled:border-transparent transition-all"
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(project)}
                    className="flex-1 rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {editingProject ? "Edit project" : "Create project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitProject} className="space-y-4 pt-2">
            <div>
              <label htmlFor="project-title" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Project title
              </label>
              <input
                id="project-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-tagline" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Summary
              </label>
              <textarea
                id="project-tagline"
                value={form.tagline}
                onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Industry" id="project-industry">
                <input
                  id="project-industry"
                  value={form.industry}
                  onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
                />
              </FormField>
              <FormField label="Assigned team" id="project-team">
                <input
                  id="project-team"
                  value={form.teamName}
                  onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
                />
              </FormField>
              <FormField label="Stage" id="project-stage">
                <select
                  id="project-stage"
                  value={form.stage}
                  onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status" id="project-status">
                <select
                  id="project-status"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Progress" id="project-progress">
              <div className="flex items-center gap-3">
                <input
                  id="project-progress"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={form.progress}
                  onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))}
                  className="flex-1 accent-[#20C997]"
                />
                <span className="w-12 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">{form.progress}%</span>
              </div>
            </FormField>

            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  tone: "mint" | "orange" | "green" | "red";
}) {
  const tones = {
    mint: "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  };
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
