import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Github,
  Lightbulb,
  Upload,
  Loader2,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  Rocket,
  Download,
  Eye,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  runFastTrack,
  uploadIncubationDocument,
  publishToInvestors,
  generateBusinessPlan,
  generateStrategy,
  analyzePivot,
  recordHumanDecision,
  type FastTrackPayload,
  type PipelineBlueprint,
  type ValidationStartResult,
} from "@/lib/api/incubation";
import { provisionWorkspace } from "@/lib/api/workspaces";
import { IncubationHumanLoopPanel } from "./IncubationHumanLoopPanel";

const STAGES = ["pre-seed", "seed", "series-a", "series-b", "growth"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABELS: Record<Stage, string> = {
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  growth: "Growth",
};

const PIPELINE_STEPS = [
  "Fetching codebase signals...",
  "Analyzing document context...",
  "Running unicorn evaluation...",
  "Mapping market intelligence...",
  "Evaluating product feasibility...",
  "Generating startup strategy...",
  "Computing finance strategy...",
  "Building business plan...",
  "Designing tech architecture...",
  "Calculating investor intelligence...",
  "Computing GSIS score...",
];

export function FastTrackPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState<Stage>("seed");
  const [oneLiner, setOneLiner] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [targetGeography, setTargetGeography] = useState("");
  const [timeConstraint, setTimeConstraint] = useState("1 week");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Step 3 state
  const [blueprint, setBlueprint] = useState<PipelineBlueprint | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [workspaceCreated, setWorkspaceCreated] = useState(false);

  const canContinue =
    startupName.trim() &&
    industry.trim() &&
    stage &&
    oneLiner.trim() &&
    (repoUrl.trim() || docFile);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setUploading(true);
    const result = await uploadIncubationDocument(file);
    setUploading(false);
    if (result && (result.document_id || result.id)) {
      setDocId(String(result.document_id || result.id));
      toast.success("Document uploaded successfully");
    } else {
      toast.error("Document upload failed — you can still proceed with repo URL");
    }
  };

  const handleAnalyze = async () => {
    setStep(2);
    setPipelineRunning(true);
    setPipelineError(null);
    setProgressIndex(0);

    // Simulate progress steps while waiting for the actual pipeline
    const interval = setInterval(() => {
      setProgressIndex((prev) => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
    }, 3000);

    const payload: FastTrackPayload = {
      startup_name: startupName.trim(),
      industry: industry.trim(),
      stage,
      one_liner: oneLiner.trim(),
      repo_url: repoUrl.trim() || undefined,
      document_id: docId || undefined,
      focus_areas: [industry.toLowerCase().replace(/\s+/g, "_")],
      target_geography: targetGeography.trim() || undefined,
      founder_constraints: { preferred_mvp_timeline: timeConstraint },
    };

    const result = await runFastTrack(payload);
    clearInterval(interval);

    if (result) {
      setProgressIndex(PIPELINE_STEPS.length);
      setBlueprint(result);
      setProjectId(result.project_id || null);
      setWorkspaceCreated(Boolean(result.workspace_id));
      setPipelineRunning(false);
      if (result.incubation_session_id) {
        const next = new URLSearchParams(searchParams);
        next.set("validationSession", result.incubation_session_id);
        setSearchParams(next, { replace: true });
      }
      setTimeout(() => setStep(3), 800);
    } else {
      setPipelineRunning(false);
      setPipelineError("Pipeline failed. Check your inputs and try again.");
    }
  };

  const handlePublish = async () => {
    if (!projectId) return;
    setPublishing(true);
    if (!blueprint?.incubation_session_id) {
      setPublishing(false);
      toast.error("Complete founder validation before publishing");
      return;
    }
    await recordHumanDecision(blueprint.incubation_session_id, "publish_investor", "approved", "Founder explicitly approved publishing this analysis to investor deal flow.");
    const result = await publishToInvestors(projectId);
    setPublishing(false);
    if (result.ok) {
      setPublished(true);
      toast.success("Your startup is now live on investor deal flow!");
    } else {
      toast.error("Failed to publish — please try again");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!projectId) return;
    if (blueprint?.workspace_id) {
      navigate(`/workspaces/copilot?ws=${encodeURIComponent(blueprint.workspace_id)}&project=${encodeURIComponent(projectId)}`);
      return;
    }
    const result = await provisionWorkspace(projectId, `${startupName} Workspace`);
    if (result.ok && result.workspace?.id) {
      setWorkspaceCreated(true);
      toast.success("Workspace created!");
      navigate(
        `/workspaces/copilot?ws=${encodeURIComponent(result.workspace.id)}&project=${encodeURIComponent(projectId)}`
      );
    } else {
      toast.error("Workspace creation failed");
    }
  };

  const handleExport = () => {
    if (!blueprint) return;
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${startupName.replace(/\s+/g, "-").toLowerCase()}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep(1);
    setStartupName("");
    setIndustry("");
    setStage("seed");
    setOneLiner("");
    setRepoUrl("");
    setTargetGeography("");
    setDocFile(null);
    setDocId(null);
    setBlueprint(null);
    setProjectId(null);
    setPublished(false);
    setWorkspaceCreated(false);
    setPipelineError(null);
  };

  // ─────────────────── STEP 1: INPUT ───────────────────
  if (step === 1) {
    return (
      <div className="h-full overflow-auto bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Rocket className="w-5 h-5 text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Fast-Track Intake</h1>
            </div>
            <p className="text-sm text-slate-600">
              Already building? Plug in your codebase and business plan. Our AI agents will
              analyze everything, compute your GSIS and execution scores, and make you visible to
              investors.
            </p>
          </div>

          <div className="space-y-5">
            {/* Startup Name */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">
                Startup name
              </label>
              <input
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="e.g. PayStack, Flutterwave"
                className="w-full h-12 bg-white border-2 border-slate-300 rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">Industry</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, HealthTech, EdTech, AI/ML"
                className="w-full h-12 bg-white border-2 border-slate-300 rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block mb-3 text-sm font-semibold text-slate-700">Stage</label>
              <div className="grid grid-cols-5 gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      stage === s
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-300 bg-white text-slate-700 hover:border-violet-300"
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* One-liner */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">
                One-liner ({oneLiner.length}/140)
              </label>
              <input
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value.slice(0, 140))}
                placeholder="What does your startup do in one sentence?"
                maxLength={140}
                className="w-full h-12 bg-white border-2 border-slate-300 rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* GitHub Repo */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                <Github className="w-4 h-4 text-slate-400" /> GitHub Repository URL
              </label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/your-org/your-repo"
                className="w-full h-12 bg-white border-2 border-slate-300 rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Public repos are analyzed automatically.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/workspaces/connectors")}
                  className="text-violet-600 hover:underline"
                >
                  Connect GitHub OAuth for private repos →
                </button>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Target geography</span><input value={targetGeography} onChange={(event) => setTargetGeography(event.target.value)} placeholder="e.g. Budapest, Hungary or West Africa" className="h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-sm outline-none focus:border-violet-500" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Preferred MVP timeline</span><select value={timeConstraint} onChange={(event) => setTimeConstraint(event.target.value)} className="h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 text-sm"><option>1 day</option><option>3 days</option><option>1 week</option><option>2–6 weeks</option></select></label>
            </div>

            {/* Document Upload */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                <Upload className="w-4 h-4 text-slate-400" /> Business Plan / Pitch Deck
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 w-full h-14 bg-white border-2 border-dashed border-slate-300 rounded-lg px-4 cursor-pointer hover:border-violet-400 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                ) : docFile ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Plus className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-sm text-slate-600">
                  {uploading
                    ? "Uploading..."
                    : docFile
                      ? docFile.name
                      : "Upload PDF, DOC, DOCX, TXT, or MD"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <button
              onClick={handleAnalyze}
              disabled={!canContinue}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Analyze My Startup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────── STEP 2: PIPELINE EXECUTION ───────────────────
  if (step === 2) {
    return (
      <div className="h-full overflow-auto bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing {startupName}</h2>
            <p className="text-sm text-slate-600">
              Our AI agents are evaluating your startup across 10 dimensions...
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            {PIPELINE_STEPS.map((label, i) => {
              const done = i < progressIndex;
              const active = i === progressIndex && pipelineRunning;
              return (
                <div key={label} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      done
                        ? "text-slate-700"
                        : active
                          ? "text-violet-700 font-medium"
                          : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {pipelineError && (
            <div className="mt-6 text-center">
              <p className="text-sm text-red-600 mb-3">{pipelineError}</p>
              <button
                onClick={handleAnalyze}
                className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {!pipelineRunning && !pipelineError && progressIndex >= PIPELINE_STEPS.length && (
            <div className="mt-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">Analysis complete!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────── STEP 3: RESULTS DASHBOARD ───────────────────
  const scores = extractScores(blueprint);
  const insights = extractInsights(blueprint);

  return (
    <div className="h-full overflow-auto bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{startupName}</h2>
            <p className="text-sm text-slate-500">
              {industry} &middot; {STAGE_LABELS[stage]} &middot; Fast-Track Analysis
            </p>
          </div>
          {published && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5" /> Live on Deal Flow
            </span>
          )}
        </div>

        {/* Hero Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ScoreHeroCard
            label="GSIS Score"
            value={scores.gsis}
            gradient="from-violet-500 to-indigo-600"
          />
          <ScoreHeroCard
            label="Unicorn Potential"
            value={scores.unicorn}
            gradient="from-amber-500 to-orange-600"
          />
          <ScoreHeroCard
            label="Investment Score"
            value={scores.investment}
            gradient="from-emerald-500 to-teal-600"
          />
        </div>

        {/* Score Circles */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scores.breakdown.slice(0, 8).map(({ label, value }) => (
              <ScoreCircle key={label} label={label} value={value} />
            ))}
          </div>
        </div>

        {/* Evaluation Bars */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Detailed Scores</h3>
          <div className="space-y-3">
            {scores.breakdown.map(({ label, value }) => (
              <EvaluationBar key={label} label={label} value={value} />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {insights.map(({ label, text }) => (
                <div key={label} className="border border-slate-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{label}</p>
                  <p className="text-sm text-slate-700 line-clamp-4">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next AI Actions */}
        {blueprint?.incubation_session_id && (
          <IncubationHumanLoopPanel
            validation={blueprint.validation as ValidationStartResult | undefined}
            workspaceId={blueprint.workspace_id}
            project={{ id: projectId, workspaceId: blueprint.workspace_id, name: startupName, summary: oneLiner, industry, stage }}
          />
        )}

        {/* Next AI Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Next AI Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NextActionButton
              icon={<FileText className="w-4 h-4" />}
              label="Generate Pitch Deck"
              onClick={async () => {
                const payload = { startup_name: startupName, solution: oneLiner, focus_areas: [industry.toLowerCase()] };
                const result = await generateBusinessPlan(payload);
                if (result) { setBlueprint({ ...blueprint, ...result } as PipelineBlueprint); toast.success("Pitch Deck generated"); }
                else toast.error("Failed to generate pitch deck");
              }}
            />
            <NextActionButton
              icon={<Rocket className="w-4 h-4" />}
              label="Build MVP Roadmap"
              onClick={async () => {
                const payload = { startup_name: startupName, solution: oneLiner, focus_areas: [industry.toLowerCase()] };
                const result = await generateStrategy(payload);
                if (result) { setBlueprint({ ...blueprint, ...result } as PipelineBlueprint); toast.success("MVP Roadmap built"); }
                else toast.error("Failed to build MVP roadmap");
              }}
            />
            <NextActionButton
              icon={<Lightbulb className="w-4 h-4" />}
              label="Explore Pivot Ideas"
              onClick={async () => {
                const payload = { startup_name: startupName, solution: oneLiner, focus_areas: [industry.toLowerCase()] };
                const result = await analyzePivot(payload);
                if (result) { setBlueprint({ ...blueprint, ...result } as PipelineBlueprint); toast.success("Pivot ideas explored"); }
                else toast.error("Failed to explore pivot ideas");
              }}
            />
            <NextActionButton
              icon={<RefreshCw className="w-4 h-4" />}
              label="Revise Idea"
              onClick={handleReset}
            />
            <NextActionButton
              icon={<Users className="w-4 h-4" />}
              label="Find Collaborators"
              onClick={() => navigate(`/matches?project=${projectId}`)}
              disabled={!projectId}
            />
            <NextActionButton
              icon={<Briefcase className="w-4 h-4" />}
              label={workspaceCreated ? "Open Workspace Copilot" : "Create Workspace"}
              onClick={handleCreateWorkspace}
              disabled={!projectId}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateWorkspace}
            disabled={!projectId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {workspaceCreated ? "Open Workspace Copilot" : "Create Workspace"}
          </button>
          <button
            onClick={handlePublish}
            disabled={published || publishing || !projectId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {published ? "Published" : "Publish to Investors"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start New
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── SHARED DISPLAY COMPONENTS ───────────────────

function NextActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 bg-violet-100 text-violet-900 px-4 py-3 rounded-lg text-sm font-medium hover:bg-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

function ScoreHeroCard({
  label,
  value,
  gradient,
}: {
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-5 text-white`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{Math.round(value)}</p>
      <p className="text-xs opacity-70 mt-1">/ 100</p>
      <svg className="absolute right-3 top-3 w-12 h-12 opacity-20" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${value} 100`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
    </div>
  );
}

function ScoreCircle({ label, value }: { label: string; value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="w-16 h-16" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          className="transition-all duration-700"
        />
        <text x="32" y="36" textAnchor="middle" className="text-xs font-bold fill-slate-700">
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function EvaluationBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-40 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">
        {Math.round(value)}
      </span>
    </div>
  );
}

// ─────────────────── HELPERS ───────────────────

interface ScoreEntry {
  label: string;
  value: number;
}

function extractScores(bp: PipelineBlueprint | null): {
  gsis: number;
  unicorn: number;
  investment: number;
  breakdown: ScoreEntry[];
} {
  if (!bp) return { gsis: 0, unicorn: 0, investment: 0, breakdown: [] };

  const gsis = num(bp.gsis_score ?? bp.gsis ?? 0);
  const unicorn = num(bp.unicorn_potential_score ?? 0);
  const investment = num(bp.investment_score ?? 0);

  const breakdown: ScoreEntry[] = [];
  const scoreFields: [string, string][] = [
    ["Market Readiness", "market_readiness_score"],
    ["Execution Velocity", "evi_score"],
    ["Product Progress", "pps_score"],
    ["Founder Reputation", "founder_reputation_score"],
    ["Community Influence", "cis_score"],
    ["Investor Interest", "iis_score"],
    ["Revenue Growth", "revenue_growth_signal"],
    ["Beta Satisfaction", "beta_satisfaction_score"],
    ["Compliance", "compliance_score"],
    ["Unicorn Potential", "unicorn_potential_score"],
    ["Investment Score", "investment_score"],
  ];

  for (const [label, key] of scoreFields) {
    const v = num(bp[key]);
    if (v > 0) breakdown.push({ label, value: v });
  }

  // Also parse any numeric fields not already captured
  for (const [key, val] of Object.entries(bp)) {
    if (
      typeof val === "number" &&
      val > 0 &&
      val <= 100 &&
      key.includes("score") &&
      !scoreFields.some(([, k]) => k === key)
    ) {
      breakdown.push({ label: humanize(key), value: val });
    }
  }

  return { gsis, unicorn, investment, breakdown };
}

function extractInsights(bp: PipelineBlueprint | null): { label: string; text: string }[] {
  if (!bp) return [];
  const insights: { label: string; text: string }[] = [];
  const textFields = [
    "market_analysis",
    "startup_strategy",
    "finance_strategy",
    "executive_summary",
    "tech_architecture",
    "investor_signals",
    "feasibility_report",
  ];
  for (const key of textFields) {
    const val = bp[key];
    if (typeof val === "string" && val.length > 50) {
      insights.push({ label: humanize(key), text: val });
    }
  }
  return insights;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Score$/, "")
    .trim();
}
