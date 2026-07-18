import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  diagnoseIdea,
  runVenturePipeline,
  type IdeaDiagnostic,
  type PipelineBlueprint,
} from "@/lib/api/incubation";
import { provisionWorkspace } from "@/lib/api/workspaces";
import { checkHealth } from "@/lib/api/health";
import { roleDashboardPath } from "@/lib/roleRoutes";

const PROBLEM_AREAS = [
  { id: "ai", label: "AI" },
  { id: "healthcare", label: "Healthcare" },
  { id: "greentech", label: "Green Tech" },
  { id: "deeptech", label: "Deep Tech" },
  { id: "web3", label: "Web3" },
];

const BLUEPRINT_SECTIONS = [
  ["executive_summary", "Executive Summary"],
  ["market_analysis", "Market Analysis"],
  ["feasibility_report", "Feasibility Report"],
  ["startup_strategy", "Startup Strategy"],
  ["finance_strategy", "Finance Strategy"],
  ["tech_architecture", "Technical Architecture"],
  ["investor_signals", "Investor Signals"],
  ["driver_breakdown", "Score Drivers"],
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asScore(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function hasContent(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(asRecord(value)).length > 0;
  return true;
}

function labelize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());
}

function valueLabel(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function LiveValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={`${index}-${valueLabel(item).slice(0, 24)}`} className="flex items-start gap-2 text-sm text-gray-700">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
            <span className="whitespace-pre-wrap break-words">{valueLabel(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    return (
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries(asRecord(value)).filter(([, item]) => hasContent(item)).map(([key, item]) => (
          <div key={key} className="border-l-2 border-cyan-100 pl-3">
            <dt className="text-xs font-semibold text-gray-500">{labelize(key)}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{valueLabel(item)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{valueLabel(value)}</p>;
}

function ScoreCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Gauge }) {
  return (
    <div className="border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{Math.round(value)}</p>
        </div>
        <Icon className="h-7 w-7 text-cyan-600" />
      </div>
      <div className="mt-4 h-2 overflow-hidden bg-gray-100">
        <div className="h-full bg-cyan-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function MainIncubationPanel() {
  const navigate = useNavigate();
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaSolution, setIdeaSolution] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [blueprint, setBlueprint] = useState<PipelineBlueprint | null>(null);
  const [diagnostic, setDiagnostic] = useState<IdeaDiagnostic | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void checkHealth().then((health) => {
      if (active) setEngineOnline(health.ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const projectId = asText(blueprint?.project_id);
  const unicornScore = asScore(blueprint?.unicorn_potential_score);
  const investmentScore = asScore(blueprint?.investment_score);
  const structuredProfile = asRecord(diagnostic?.structured_profile);
  const nextSteps = Array.isArray(diagnostic?.next_steps)
    ? diagnostic.next_steps.filter((step): step is string => typeof step === "string" && step.trim().length > 0)
    : [];
  const sections = useMemo(
    () => BLUEPRINT_SECTIONS
      .map(([key, label]) => ({ key, label, value: blueprint?.[key] }))
      .filter((section) => hasContent(section.value)),
    [blueprint],
  );
  const canAnalyze = ideaTitle.trim().length > 0 && ideaSolution.trim().length > 0 && selectedAreas.length > 0;

  const toggleArea = (id: string) => {
    setSelectedAreas((current) => current.includes(id)
      ? current.filter((area) => area !== id)
      : [...current, id]);
  };

  const handleRunAnalysis = async () => {
    if (!canAnalyze || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setBlueprint(null);
    setDiagnostic(null);

    const payload = {
      startup_name: ideaTitle.trim(),
      solution: ideaSolution.trim(),
      focus_areas: selectedAreas,
    };

    try {
      const [diagnosticResult, pipelineResult] = await Promise.all([
        diagnoseIdea(payload),
        runVenturePipeline(payload),
      ]);
      const persistedProjectId = asText(pipelineResult?.project_id);
      const pipelineError = asText(pipelineResult?.error);
      if (!pipelineResult || !persistedProjectId) {
        throw new Error(pipelineError || "The analysis did not return a persisted project ID.");
      }
      setDiagnostic(diagnosticResult);
      setBlueprint(pipelineResult);
      toast.success("Analysis persisted");
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : "Live analysis is unavailable.";
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!projectId || provisioning) return;
    setProvisioning(true);
    try {
      const result = await provisionWorkspace(projectId, `${ideaTitle.trim()} Workspace`);
      const workspaceId = asText(result.workspace?.id);
      if (!result.ok || !workspaceId) {
        throw new Error(result.error || "The workspace was not persisted.");
      }
      navigate(`/workspaces?ws=${encodeURIComponent(workspaceId)}&project=${encodeURIComponent(projectId)}`);
    } catch (workspaceError) {
      toast.error(workspaceError instanceof Error ? workspaceError.message : "Workspace creation failed.");
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to={roleDashboardPath.founder}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Founder dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Startup Incubation</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${engineOnline ? "bg-emerald-500" : engineOnline === false ? "bg-red-500" : "bg-gray-300"}`} />
            <span className="font-medium text-gray-700">
              {engineOnline === null ? "Checking AI service" : engineOnline ? "AI service available" : "AI service unavailable"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[360px_1fr]">
        <section className="self-start border border-gray-200 bg-white p-6 lg:sticky lg:top-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-cyan-50 text-cyan-700">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Venture intake</h2>
              <p className="text-sm text-gray-500">Persist a diagnostic and full analysis</p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-800">Startup name</span>
              <input
                type="text"
                value={ideaTitle}
                onChange={(event) => setIdeaTitle(event.target.value)}
                className="mt-2 h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-800">Solution</span>
              <textarea
                rows={5}
                value={ideaSolution}
                onChange={(event) => setIdeaSolution(event.target.value)}
                className="mt-2 w-full resize-y border border-gray-300 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-gray-800">Focus areas</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PROBLEM_AREAS.map((area) => {
                  const selected = selectedAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm ${selected ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-gray-200 text-gray-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleArea(area.id)}
                        className="accent-cyan-700"
                      />
                      {area.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              disabled={!canAnalyze || analyzing}
              onClick={() => void handleRunAnalysis()}
              className="flex h-11 w-full items-center justify-center gap-2 bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              {analyzing ? "Running analysis" : "Run analysis"}
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-5 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Analysis unavailable</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!blueprint && !error && (
            <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-gray-300 bg-white px-8 text-center">
              <Brain className="mb-4 h-9 w-9 text-gray-400" />
              <h2 className="font-semibold text-gray-900">No persisted analysis selected</h2>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Live diagnostic and pipeline results will appear after the service persists a project.
              </p>
            </div>
          )}

          {blueprint && (
            <>
              <section className="border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div>
                      <h2 className="font-semibold text-emerald-950">
                        {asText(blueprint.venture_name) || ideaTitle} persisted
                      </h2>
                      <p className="mt-1 break-all text-xs text-emerald-800">Project {projectId}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!projectId || provisioning}
                    onClick={() => void handleCreateWorkspace()}
                    className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-gray-300"
                  >
                    <Briefcase className="h-4 w-4" />
                    {provisioning ? "Creating workspace" : "Create workspace"}
                  </button>
                </div>
              </section>

              {(unicornScore !== null || investmentScore !== null) && (
                <section className="grid gap-4 sm:grid-cols-2">
                  {unicornScore !== null && <ScoreCard label="Unicorn Potential" value={unicornScore} icon={Sparkles} />}
                  {investmentScore !== null && <ScoreCard label="Investment Score" value={investmentScore} icon={Gauge} />}
                </section>
              )}

              {(hasContent(blueprint.unicorn_classification) || hasContent(blueprint.pivot_needed)) && (
                <section className="grid gap-4 border border-gray-200 bg-white p-5 sm:grid-cols-2">
                  {hasContent(blueprint.unicorn_classification) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Classification</p>
                      <p className="mt-1 font-medium text-gray-900">{valueLabel(blueprint.unicorn_classification)}</p>
                    </div>
                  )}
                  {hasContent(blueprint.pivot_needed) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Pivot Recommended</p>
                      <p className="mt-1 font-medium text-gray-900">{valueLabel(blueprint.pivot_needed)}</p>
                    </div>
                  )}
                </section>
              )}

              {Object.keys(structuredProfile).length > 0 && (
                <section className="border border-gray-200 bg-white p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-700" />
                    <h2 className="font-semibold text-gray-900">Persisted Venture Profile</h2>
                  </div>
                  <LiveValue value={structuredProfile} />
                </section>
              )}

              {sections.map((section) => (
                <section key={section.key} className="border border-gray-200 bg-white p-6">
                  <h2 className="mb-5 font-semibold text-gray-900">{section.label}</h2>
                  <LiveValue value={section.value} />
                </section>
              ))}

              {nextSteps.length > 0 && (
                <section className="border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 font-semibold text-gray-900">Persisted Next Steps</h2>
                  <LiveValue value={nextSteps} />
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
