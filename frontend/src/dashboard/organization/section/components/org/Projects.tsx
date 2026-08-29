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
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (value.includes("complete") || value.includes("done")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (value.includes("track") || value.includes("active")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
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
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
          <p className="mt-2 text-gray-600">
            Create, track, and scale your persisted innovation portfolio
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Create Project
        </button>
      </div>

      {notice && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-medium text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Projects" value={stats.total} icon={TrendingUp} tone="blue" />
        <MetricCard label="In Progress" value={stats.inProgress} icon={Clock} tone="orange" />
        <MetricCard label="Market Ready" value={stats.marketReady} icon={Rocket} tone="green" />
        <MetricCard label="At Risk" value={stats.atRisk} icon={AlertCircle} tone="red" />
      </div>

      <div className="mb-6 border-y border-gray-200 bg-white py-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search persisted projects"
              className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="relative min-w-52">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All stages</option>
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Project Pipeline</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.value} className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p className="text-sm font-semibold text-indigo-900">{stage.label}</p>
              <p className="mt-1 text-xs text-indigo-700">
                {projects.filter((project) => normalizedStage(project.stage) === stage.value).length}
                {" "}projects
              </p>
            </div>
          ))}
        </div>
      </section>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading persisted projects...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <FolderKanban className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <h2 className="font-semibold text-gray-900">
            {projects.length === 0 ? "No persisted projects yet" : "No projects match these filters"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {projects.length === 0
              ? "Create the first organization project to start tracking the portfolio."
              : "Adjust the search or stage filter to see other projects."}
          </p>
          {projects.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
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
              className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-900">{project.title}</h3>
                      <p className="mt-1 truncate text-sm text-gray-600">
                        {[project.industry, project.teamName || "No assigned team"]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {project.tagline && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{project.tagline}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(project)}
                      title={`Edit ${project.title}`}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(project.status)}`}>
                      {labelFor(project.status, "Planned")}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {labelFor(project.stage, "Idea")}
                    </span>
                    {project.aiLevel && (
                      <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                        AI: {project.aiLevel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Market Ready</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {project.marketReadyScore > 0 ? `${project.marketReadyScore}/100` : "Not scored"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Team Size</p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Users className="h-4 w-4 text-gray-500" />
                        {project.memberCount}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Last Update</p>
                      <p className="truncate text-sm text-gray-900">
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
                    className="flex-1 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(project)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit project" : "Create project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitProject} className="space-y-4">
            <div>
              <label htmlFor="project-title" className="mb-1.5 block text-sm font-medium text-gray-700">
                Project title
              </label>
              <input
                id="project-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-tagline" className="mb-1.5 block text-sm font-medium text-gray-700">
                Summary
              </label>
              <textarea
                id="project-tagline"
                value={form.tagline}
                onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Industry" id="project-industry">
                <input
                  id="project-industry"
                  value={form.industry}
                  onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
              <FormField label="Assigned team" id="project-team">
                <input
                  id="project-team"
                  value={form.teamName}
                  onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
              <FormField label="Stage" id="project-stage">
                <select
                  id="project-stage"
                  value={form.stage}
                  onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-12 text-right text-sm font-semibold text-gray-900">{form.progress}%</span>
              </div>
            </FormField>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
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
  tone: "blue" | "orange" | "green" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
