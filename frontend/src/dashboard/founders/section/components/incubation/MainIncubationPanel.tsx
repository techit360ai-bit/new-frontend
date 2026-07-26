import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  runVenturePipeline,
  analyzeUnicorn,
  analyzeMarket,
  generateStrategy,
  generateBusinessPlan,
  analyzePivot,
  generateInvestorReadiness,
  analyzeFinance,
  analyzeFeasibility,
  designTechStack,
  type PipelineBlueprint,
} from "@/lib/api/incubation";
import { provisionWorkspace } from "@/lib/api/workspaces";
import { checkHealth } from "@/lib/api/health";

type AnalysisType =
  | "unicorn"
  | "pmf"
  | "swot"
  | "market"
  | "monetization"
  | "business-plan"
  | "feasibility"
  | "finance"
  | "strategy"
  | "intelligence"
  | "impact"
  | "investor"
  | "roadmap"
  | "survey"
  | "tech"
  | "recommendation";

const ANALYSIS_TYPES: Array<{ id: AnalysisType; label: string; icon: typeof Sparkles }> = [
  { id: "unicorn", label: "Unicorn Potential", icon: Sparkles },
  { id: "pmf", label: "PMF Analysis", icon: Target },
  { id: "swot", label: "SWOT Analysis", icon: BarChart3 },
  { id: "market", label: "Market Validation", icon: TrendingUp },
  { id: "monetization", label: "Monetization Logic", icon: Zap },
  { id: "business-plan", label: "Business Plan Generation", icon: FileText },
  { id: "feasibility", label: "Feasibility", icon: CheckCircle2 },
  { id: "finance", label: "Finance Strategy", icon: BarChart3 },
  { id: "strategy", label: "Startup Strategy", icon: Rocket },
  { id: "intelligence", label: "Market Intelligence", icon: Brain },
  { id: "impact", label: "Impact Predictor", icon: TrendingUp },
  { id: "investor", label: "Investor Intelligence", icon: Briefcase },
  { id: "roadmap", label: "Execution Roadmap", icon: Activity },
  { id: "survey", label: "Market Survey", icon: Users },
  { id: "tech", label: "Tech Architecture", icon: Zap },
  { id: "recommendation", label: "Project Recommendation", icon: Lightbulb },
];

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asScore(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function ScoreCircle({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" | "lg" }) {
  const radius = size === "sm" ? 40 : size === "lg" ? 60 : 50;
  const strokeWidth = size === "sm" ? 6 : size === "lg" ? 10 : 8;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: offset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl"}`}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <p className={`text-center font-medium text-gray-700 ${size === "sm" ? "text-xs" : "text-sm"}`}>{label}</p>
    </div>
  );
}

function EvaluationBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{Math.round(score)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function MainIncubationPanel() {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [ideaInput, setIdeaInput] = useState("");
  const [copilotInput, setCopilotInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [blueprintData, setBlueprintData] = useState<PipelineBlueprint | null>(null);

  useEffect(() => {
    let active = true;
    void checkHealth().then((health) => {
      if (active) setEngineOnline(health.ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const projectId = asText(blueprintData?.project_id);
  const ventureName = asText(blueprintData?.venture_name) || "Your Startup";
  const unicornScore = asScore(blueprintData?.unicorn_potential_score);
  const investmentScore = asScore(blueprintData?.investment_score);

  const handleRunFullAnalysis = async () => {
    if (!ideaInput.trim() || analyzing) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setBlueprintData(null);

    const payload = {
      startup_name: ideaInput.trim(),
      solution: ideaInput.trim(),
      focus_areas: ["ai", "deeptech"],
    };

    try {
      const result = await runVenturePipeline(payload);
      if (!result) {
        throw new Error("Pipeline returned no data");
      }
      setBlueprintData(result);
      setAnalysisResult(result);
      toast.success("Full pipeline analysis complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunIndividualAnalysis = async (type: AnalysisType) => {
    if (!ideaInput.trim() || analyzing) {
      toast.error("Please enter your startup idea first");
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    setSelectedAnalysis(type);

    const payload = {
      startup_name: ideaInput.trim(),
      solution: ideaInput.trim(),
      focus_areas: ["ai", "deeptech"],
    };

    try {
      let result: Record<string, unknown> | null = null;
      switch (type) {
        case "unicorn":
          result = await analyzeUnicorn(payload);
          break;
        case "market":
        case "pmf":
        case "survey":
          result = await analyzeMarket(payload);
          break;
        case "strategy":
        case "roadmap":
          result = await generateStrategy(payload);
          break;
        case "business-plan":
          result = await generateBusinessPlan(payload);
          break;
        case "swot":
        case "recommendation":
          result = await analyzePivot(payload);
          break;
        case "investor":
          result = await generateInvestorReadiness(payload);
          break;
        case "finance":
        case "monetization":
          result = await analyzeFinance(payload);
          break;
        case "feasibility":
        case "impact":
          result = await analyzeFeasibility(payload);
          break;
        case "tech":
          result = await designTechStack(payload);
          break;
        default:
          result = await analyzeUnicorn(payload);
      }

      if (!result) {
        throw new Error("Analysis returned no data");
      }
      setAnalysisResult(result);
      toast.success(`${ANALYSIS_TYPES.find((a) => a.id === type)?.label} complete`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!projectId) {
      toast.error("No project to create workspace for");
      return;
    }
    try {
      const result = await provisionWorkspace(projectId, `${ventureName} Workspace`);
      const workspaceId = asText(result.workspace?.id);
      if (!result.ok || !workspaceId) {
        throw new Error(result.error || "Workspace creation failed");
      }
      navigate(`/workspaces?ws=${encodeURIComponent(workspaceId)}&project=${encodeURIComponent(projectId)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Workspace creation failed");
    }
  };

  const handleExportReport = () => {
    if (!analysisResult) return;
    const data = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="flex h-screen bg-violet-50">
      {/* LEFT SIDEBAR - 264px */}
      <aside className="w-[264px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Analysis Types</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${engineOnline ? "bg-emerald-500" : "bg-gray-300"}`} />
            <span className="text-xs text-gray-600">
              {engineOnline === null ? "Checking..." : engineOnline ? "AI Engine Active" : "Engine Offline"}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {ANALYSIS_TYPES.map((analysis) => {
            const Icon = analysis.icon;
            const isSelected = selectedAnalysis === analysis.id;
            return (
              <button
                key={analysis.id}
                onClick={() => void handleRunIndividualAnalysis(analysis.id)}
                disabled={analyzing}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-medium text-left transition-colors rounded ${
                  isSelected
                    ? "bg-violet-100 text-violet-900"
                    : "text-gray-700 hover:bg-violet-50 hover:text-violet-800"
                } disabled:opacity-50`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{analysis.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">AI Copilot</h3>
          <textarea
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            placeholder="Ask AI anything..."
            rows={3}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
          />
          <button
            onClick={() => {
              if (copilotInput.trim()) {
                toast.info("Copilot feature coming soon");
                setCopilotInput("");
              }
            }}
            disabled={!copilotInput.trim()}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-violet-600 text-white px-3 py-2 text-sm font-medium rounded hover:bg-violet-700 disabled:bg-gray-300"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </aside>

      {/* CENTER PANEL - flex-1 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Real-Time AI Analysis</h1>
              <div className="flex items-center gap-2 mt-1">
                {analyzing && (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-violet-600" />
                    <span className="text-sm text-violet-700">Processing...</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleExportReport}
              disabled={!analysisResult}
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 text-sm font-medium rounded hover:bg-violet-700 disabled:bg-gray-300"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Banner */}
          {blueprintData && projectId && (
            <div className="mb-6 border border-emerald-200 bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">{ventureName} analyzed successfully</p>
                    <p className="text-xs text-emerald-700">Project ID: {projectId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero Score Cards */}
          {(unicornScore !== null || investmentScore !== null) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {unicornScore !== null && (
                <div className="bg-gradient-to-br from-violet-600 to-violet-900 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Unicorn Potential</h3>
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-5xl font-bold">{Math.round(unicornScore)}</p>
                  <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${unicornScore}%` }} />
                  </div>
                </div>
              )}
              {investmentScore !== null && (
                <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Market Fit Score</h3>
                    <Target className="h-6 w-6" />
                  </div>
                  <p className="text-5xl font-bold">{Math.round(investmentScore)}</p>
                  <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${investmentScore}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Evaluation Bars */}
          {analysisResult && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Evaluation</h3>
              <div className="space-y-4">
                {Object.entries(analysisResult)
                  .filter(([key, val]) => typeof val === "number" && key.includes("score"))
                  .map(([key, val]) => (
                    <EvaluationBar
                      key={key}
                      label={key.replace(/_/g, " ").replace(/score/i, "").trim()}
                      score={asScore(val) ?? 0}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Circular Score Indicators */}
          {analysisResult && Object.keys(analysisResult).some((k) => k.includes("score")) && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Metrics</h3>
              <div className="flex flex-wrap gap-8 justify-center">
                {Object.entries(analysisResult)
                  .filter(([key, val]) => typeof val === "number" && key.includes("score"))
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <ScoreCircle
                      key={key}
                      score={asScore(val) ?? 0}
                      label={key.replace(/_/g, " ").replace(/score/i, "").trim()}
                      size="md"
                    />
                  ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {analysisResult && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-600" />
                AI Insights
              </h3>
              <div className="space-y-3">
                {Object.entries(analysisResult)
                  .filter(([key, val]) => typeof val === "string" && val.length > 50)
                  .slice(0, 3)
                  .map(([key, val]) => (
                    <div key={key} className="border-l-4 border-violet-600 pl-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-600">{String(val)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Next AI Actions */}
          {analysisResult && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Next AI Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-2 bg-violet-100 text-violet-900 px-4 py-3 rounded font-medium hover:bg-violet-200">
                  <FileText className="h-4 w-4" />
                  Generate Pitch Deck
                </button>
                <button className="flex items-center gap-2 bg-violet-100 text-violet-900 px-4 py-3 rounded font-medium hover:bg-violet-200">
                  <Rocket className="h-4 w-4" />
                  Build MVP Roadmap
                </button>
                <button className="flex items-center gap-2 bg-violet-100 text-violet-900 px-4 py-3 rounded font-medium hover:bg-violet-200">
                  <Lightbulb className="h-4 w-4" />
                  Explore Pivot Ideas
                </button>
                <button className="flex items-center gap-2 bg-violet-100 text-violet-900 px-4 py-3 rounded font-medium hover:bg-violet-200">
                  <RefreshCw className="h-4 w-4" />
                  Revise Idea
                </button>
                <button
                  onClick={() => navigate(`/matches?project=${projectId}`)}
                  disabled={!projectId}
                  className="flex items-center gap-2 bg-violet-600 text-white px-4 py-3 rounded font-medium hover:bg-violet-700 disabled:bg-gray-300"
                >
                  <Users className="h-4 w-4" />
                  Find Collaborators
                </button>
                <button
                  onClick={() => void handleCreateWorkspace()}
                  disabled={!projectId}
                  className="flex items-center gap-2 bg-violet-600 text-white px-4 py-3 rounded font-medium hover:bg-violet-700 disabled:bg-gray-300"
                >
                  <Briefcase className="h-4 w-4" />
                  Create Workspace
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!analysisResult && !analyzing && (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <Brain className="h-16 w-16 text-violet-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Analysis Yet</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Enter your startup idea below and run an analysis to see detailed insights, scores, and recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="Describe your startup idea..."
              rows={2}
              className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => void handleRunFullAnalysis()}
                disabled={!ideaInput.trim() || analyzing}
                className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 text-sm font-medium rounded hover:bg-violet-700 disabled:bg-gray-300"
              >
                {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run Analysis
              </button>
              <button
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium rounded hover:bg-gray-200"
                onClick={() => toast.info("Document upload coming soon")}
              >
                <FileText className="h-4 w-4" />
                Upload Docs
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL - 420px, collapsible */}
      {rightPanelOpen && (
        <aside className="w-[420px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Document Preview</h2>
            <button onClick={() => setRightPanelOpen(false)} className="text-gray-500 hover:text-gray-700">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {analysisResult ? (
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-violet-600" />
                    Idea Summary
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{ideaInput || "Your startup idea"}</p>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-violet-600" />
                    AI Analysis Summary
                  </h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    {Object.entries(analysisResult)
                      .filter(([, val]) => typeof val === "string")
                      .slice(0, 2)
                      .map(([key, val]) => (
                        <p key={key} className="leading-relaxed">
                          {String(val).slice(0, 200)}...
                        </p>
                      ))}
                  </div>
                </section>

                {typeof blueprintData?.business_plan === "string" && blueprintData.business_plan && (
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-violet-600" />
                      Business Plan Excerpt
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {String(blueprintData.business_plan).slice(0, 300)}...
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-violet-600" />
                    Recommendations & Risks
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analysisResult)
                      .filter(([key]) => key.includes("risk") || key.includes("recommendation"))
                      .map(([key, val]) => (
                        <div key={key} className="text-sm">
                          <p className="font-medium text-gray-800">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-gray-600">{String(val)}</p>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No document to preview yet</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              disabled={!analysisResult}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2.5 text-sm font-medium rounded hover:bg-violet-700 disabled:bg-gray-300"
            >
              Publish
            </button>
            <button
              onClick={handleExportReport}
              disabled={!analysisResult}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 text-sm font-medium rounded hover:bg-gray-50 disabled:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </aside>
      )}

      {/* Toggle button when panel is closed */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 bg-violet-600 text-white p-2 rounded-l shadow-lg hover:bg-violet-700"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
      )}
    </div>
  );
}
