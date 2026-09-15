import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, Lock, Sparkles } from "lucide-react";
import {
  getAcademyCurriculum,
  getAcademyProjects,
  type AcademyCurriculum,
  type AcademyModule,
  type AcademyProject,
} from "@/lib/api/academy";
import { LessonView } from "./LessonView";

export type AcademyRole = "founder" | "collaborator";

export function Academy({ role, userName = "there" }: { role: AcademyRole; userName?: string }) {
  const [projects, setProjects] = useState<AcademyProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [curriculum, setCurriculum] = useState<AcademyCurriculum | null>(null);
  const [selected, setSelected] = useState<AcademyModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAcademyProjects(role)
      .then((result) => {
        if (!active) return;
        setProjects(result.projects || []);
        setProjectId((current) => current || result.projects?.[0]?.id || "");
      })
      .catch(() => active && setError("Academy projects are temporarily unavailable."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    setLoading(true);
    getAcademyCurriculum(projectId)
      .then((result) => active && setCurriculum(result.curriculum))
      .catch(() => active && setError("This project curriculum could not be loaded."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [projectId]);

  const next = useMemo(
    () =>
      curriculum?.modules.find((module) => module.id === curriculum.nextModuleId) ||
      curriculum?.modules.find(
        (module) => module.status === "unlocked" || module.status === "in_progress",
      ) ||
      null,
    [curriculum],
  );

  if (selected && curriculum) {
    return (
      <LessonView
        curriculum={curriculum}
        module={selected}
        onBack={() => setSelected(null)}
        onRefresh={() =>
          getAcademyCurriculum(projectId).then((result) => setCurriculum(result.curriculum))
        }
      />
    );
  }

  return (
    <div className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#20C997]">
              Build while you learn
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              TechIT Academy
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl">
              Project-aware training for {role === "founder" ? "founders" : "collaborators"} — focused
              on the shortest credible path to the next milestone.
            </p>
          </div>
          {projects.length > 0 && (
            <label className="min-w-[240px] text-sm font-bold text-slate-700 dark:text-slate-300">
              Project
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#111111] text-slate-900 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 transition-all font-normal"
              >
                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-white dark:bg-[#111111] text-slate-900 dark:text-white"
                  >
                    {project.name} · {project.stage}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && (
          <p className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 h-40 animate-pulse rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02]" />
        )}

        {!loading && !projects.length && (
          <div className="mt-8 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/15 p-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            No authorized projects are available for this Academy track yet.
          </div>
        )}

        {curriculum && (
          <>
            {/* Greeting & Progress highlight */}
            <div className="mt-8 rounded-2xl border border-[#20C997]/25 bg-[#20C997]/5 dark:bg-[#20C997]/10 p-6 backdrop-blur-xl shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#20C997]/10 flex items-center justify-center text-[#20C997] shrink-0 font-bold">
                  <Sparkles className="h-5 w-5 text-[#20C997]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">
                    Hey {userName} — {curriculum.progress.completed} of {curriculum.progress.total}{" "}
                    modules complete.
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {curriculum.estimatedHours} hours estimated · approximately{" "}
                    {curriculum.estimatedWeeks} weeks at the default learning budget · stage:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {curriculum.stage}
                    </span>
                  </p>
                  <p className="mt-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Next recommended module:{" "}
                    <span className="font-bold text-[#20C997]">
                      {next?.title || "All assigned modules complete"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="mt-8 grid gap-4">
              {curriculum.modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  disabled={module.status === "locked"}
                  onClick={() => setSelected(module)}
                  className={`rounded-2xl border p-6 text-left transition-all duration-200 backdrop-blur-xl ${
                    module.status === "locked"
                      ? "cursor-not-allowed border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] opacity-60"
                      : module.status === "complete"
                      ? "border-[#20C997]/30 bg-[#20C997]/5 dark:bg-[#20C997]/10 hover:border-[#20C997]/50"
                      : "border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] hover:border-[#20C997]/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span className="text-[#20C997]">{module.phase}</span>
                        <span>·</span>
                        <span>{module.priority}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> {module.estimatedHours}h
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {module.title}
                      </h2>
                      <p className="mt-1 text-sm font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                    <div className="shrink-0 pt-1">
                      {module.status === "locked" ? (
                        <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                      ) : module.status === "complete" ? (
                        <div className="w-9 h-9 rounded-xl bg-[#20C997]/15 text-[#20C997] flex items-center justify-center font-bold">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#20C997]/10 text-[#20C997] flex items-center justify-center font-bold">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {module.prerequisites.length > 0 && (
                    <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                      Prerequisite: {module.prerequisites.join(", ")}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {module.content.caseStudies.length} documented company cases ·{" "}
                    {module.content.keyConcepts.length} concepts
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
