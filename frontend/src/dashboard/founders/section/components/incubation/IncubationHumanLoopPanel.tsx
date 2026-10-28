import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, Code2, ExternalLink, Globe2, Loader2, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createSandboxBuild,
  deploySandboxPreview,
  downloadSandboxArtifact,
  fetchSandboxPreview,
  generateSessionMVPPlan,
  recordHumanDecision,
  runSessionPMFValidation,
  submitFounderAnswers,
  type FounderQuestion,
  type IncubationSession,
  type SandboxBuild,
  type ValidationStartResult,
} from "@/lib/api/incubation";
import {
  CollaboratorInviteDialog,
  markValidationStoryShown,
  ValidationStoryDialog,
  validationStoryDue,
  type IncubationProjectContext,
} from "./IncubationCollaborationPrompts";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function answerValue(value: unknown): Record<string, string> {
  const record = objectValue(value);
  return Object.fromEntries(Object.entries(record).map(([key, answer]) => [key, typeof answer === "string" ? answer : String(answer ?? "")]));
}

export function IncubationHumanLoopPanel({
  validation,
  workspaceId,
  project = {},
}: {
  validation?: ValidationStartResult | null;
  workspaceId?: string;
  project?: IncubationProjectContext;
}) {
  const navigate = useNavigate();
  const [session, setSession] = useState<IncubationSession | null>(validation?.session ?? null);
  const [questions, setQuestions] = useState<FounderQuestion[]>(validation?.founder_questions ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(() => answerValue(validation?.founder_answers ?? validation?.session.state?.founder_answers));
  const [busy, setBusy] = useState<string | null>(null);
  const [pmf, setPmf] = useState<Record<string, unknown>>(() => objectValue(validation?.pmf_validation ?? validation?.session.state?.pmf_validation));
  const [mvp, setMvp] = useState<Record<string, unknown>>(() => objectValue(validation?.mvp_plan ?? validation?.session.state?.roadmap));
  const [scope, setScope] = useState("one_week_mvp");
  const [build, setBuild] = useState<SandboxBuild | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    setSession(validation?.session ?? null);
    setQuestions(Array.isArray(validation?.founder_questions) ? validation.founder_questions : []);
    setAnswers(answerValue(validation?.founder_answers ?? validation?.session.state?.founder_answers));
    setPmf(objectValue(validation?.pmf_validation ?? validation?.session.state?.pmf_validation));
    setMvp(objectValue(validation?.mvp_plan ?? validation?.session.state?.roadmap));
  }, [validation]);

  const state = objectValue(session?.state);
  const evidence = objectValue(state.evidence ?? validation?.evidence);
  const geography = objectValue(state.geography ?? validation?.geography);
  const company = objectValue(state.company_building ?? validation?.company_building);
  const sources = arrayValue(evidence.sources);
  const contradictions = arrayValue(evidence.contradictory_evidence);
  const decisions = arrayValue(state.decisions);
  const approval = (action: string) => decisions.some((item) => item.action === action && ["approve", "approved", "accept", "accepted"].includes(String(item.decision).toLowerCase()));
  const unanswered = useMemo(() => questions.filter((q) => !answers[q.id]?.trim()).length, [answers, questions]);

  if (!session) return null;

  const saveAnswers = async () => {
    setBusy("answers");
    try {
      const result = await submitFounderAnswers(session.id, answers);
      setSession(result.session); setQuestions(Array.isArray(result.founder_questions) ? result.founder_questions : []);
      toast.success(result.validation_blocked ? "Answers saved; critical gaps remain" : "Founder questions answered");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save answers"); }
    finally { setBusy(null); }
  };

  const validatePMF = async () => {
    setBusy("pmf");
    try { const result = await runSessionPMFValidation(session.id); setSession(result.session); setPmf(result.pmf_validation); }
    catch (error) { toast.error(error instanceof Error ? error.message : "PMF validation failed"); }
    finally { setBusy(null); }
  };

  const decide = async (action: string, rationale: string) => {
    setBusy(action);
    try {
      const result = await recordHumanDecision(session.id, action, "approved", rationale);
      setSession(result.session);
      toast.success("Human decision recorded");
      if (action === "validate_idea") setInviteOpen(true);
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Decision could not be recorded"); }
    finally { setBusy(null); }
  };

  const updateInviteOpen = (open: boolean) => {
    setInviteOpen(open);
    if (!open && validationStoryDue()) {
      markValidationStoryShown();
      setStoryOpen(true);
    }
  };

  const planMvp = async () => {
    setBusy("mvp");
    try {
      const result = await generateSessionMVPPlan(session.id, { preferred_scope: scope, time_available: "founder supplied in answers", autonomy_cap: 0.6 });
      setSession(result.session); setMvp(result.mvp_plan);
    } catch (error) { toast.error(error instanceof Error ? error.message : "MVP plan failed"); }
    finally { setBusy(null); }
  };

  const buildSandbox = async () => {
    setBusy("build");
    try { const result = await createSandboxBuild(session.id, scope, workspaceId); setBuild(result); toast.success("Private sandbox artifact created"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Sandbox build failed"); }
    finally { setBusy(null); }
  };

  const deployPreview = async () => {
    if (!build) return;
    setBusy("deploy");
    try { const result = await deploySandboxPreview(session.id, build.id); setBuild(result); toast.success(result.status === "deployed_preview" ? "Private preview deployed" : "Deployment integration status updated"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Preview deployment failed"); }
    finally { setBusy(null); }
  };

  const openProtectedBlob = async (kind: "artifact" | "preview") => {
    if (!build) return;
    setBusy(kind);
    try {
      const blob = kind === "artifact" ? await downloadSandboxArtifact(build.id) : await fetchSandboxPreview(build.id);
      const url = URL.createObjectURL(blob);
      if (kind === "artifact") {
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = `techit-mvp-${build.id}.zip`; anchor.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : `Could not open ${kind}`); }
    finally { setBusy(null); }
  };

  return (
    <>
    <section className="mb-6 space-y-4 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#171330] dark:text-white">Founder Validation &amp; Human Decisions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI autonomy is capped at 60%. Scores and plans remain provisional until you approve them.</p>
        </div>
        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          {session.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#171330] dark:text-white">
            <CircleHelp className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" /> Founder questions
          </h4>
          <div className="space-y-3">
            {questions.map((question) => (
              <label key={question.id} className="block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{question.question}</span>
                {question.why_it_matters && <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{question.why_it_matters}</span>}
                <textarea
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswers((old) => ({ ...old, [question.id]: event.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-colors"
                />
              </label>
            ))}
          </div>
          <button
            onClick={saveAnswers}
            disabled={busy !== null || questions.length === 0}
            className="mt-3 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:shadow-none"
          >
            {busy === "answers" ? "Saving..." : `Save answers (${unanswered} incomplete)`}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#171330] dark:text-white">
              <Search className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" /> Evidence, competitors and failures
            </h4>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Research mode: {String(evidence.research_mode ?? "pending")}. Synthetic/model knowledge is never presented as customer validation.</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {sources.slice(0, 5).map((source, index) => (
                <li key={String(source.url ?? index)}>
                  <a className="text-[#0066ff] dark:text-[#58a6ff] hover:underline" href={String(source.url)} target="_blank" rel="noreferrer">
                    {String(source.title ?? source.url)}
                  </a> · {String(source.geography ?? "geography not supplied")}
                </li>
              ))}
            </ul>
            {contradictions.length > 0 && (
              <p className="mt-2 flex gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {contradictions.length} contradictory evidence item(s) require review.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#171330] dark:text-white">
              <Globe2 className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" /> Geography
            </h4>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-black/[0.03] dark:bg-black/30 p-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
              {JSON.stringify(geography.primary_geography ?? geography, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[#171330] dark:text-white">Evidence-backed PMF verdict</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">The AI can challenge assumptions and propose a verdict; only a human can mark the idea validated.</p>
          </div>
          <button
            onClick={validatePMF}
            disabled={busy !== null}
            className="rounded-xl bg-[#171330] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40"
          >
            {busy === "pmf" ? "Testing..." : "Run PMF falsification"}
          </button>
        </div>
        {Object.keys(pmf).length > 0 && (
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-black/[0.03] dark:bg-black/40 border border-black/[0.06] dark:border-white/10 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
            {JSON.stringify(pmf, null, 2)}
          </pre>
        )}
        <button
          onClick={() => decide("validate_idea", "Founder reviewed the questions, evidence, contradictions and falsification tests.")}
          disabled={busy !== null || approval("validate_idea")}
          className="mt-3 flex items-center gap-2 rounded-xl border border-[#20c937]/40 bg-[#20c937]/10 px-3 py-2 text-xs font-bold text-[#20c937] hover:bg-[#20c937]/20 transition-colors disabled:opacity-40"
        >
          <ShieldCheck className="h-4 w-4" /> {approval("validate_idea") ? "Human validation recorded" : "I approve the validation decision"}
        </button>
      </div>

      <div className="rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5 dark:bg-[#0066ff]/10 p-4">
        <h4 className="text-sm font-bold text-[#171330] dark:text-white">Build a company, not only a product</h4>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">The first product is the wedge. Company validation tests recurring customer value, repeatable distribution, an operating model, business model, expansion and a compounding advantage.</p>
        {Object.keys(company).length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <CompanyDimension label="Company thesis" value={company.company_thesis} />
            <CompanyDimension label="Product wedge" value={company.wedge} />
            <CompanyDimension label="Repeatability" value={company.repeatability} />
            <CompanyDimension label="Distribution" value={company.distribution} />
            <CompanyDimension label="Operating model" value={company.operating_model} />
            <CompanyDimension label="Defensibility" value={company.defensibility} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Company-building analysis will appear after the validation session starts.</p>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-[#171330] dark:text-white">
          <Code2 className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" /> MVP scope, code plan and private preview
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["one_day_prototype", "1 day"], ["three_day_demo", "3 days"], ["one_week_mvp", "1 week"], ["production_mvp_2_to_6_weeks", "2–6 weeks"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                scope === id
                  ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={planMvp}
            disabled={busy !== null}
            className="rounded-xl bg-[#171330] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40"
          >
            {busy === "mvp" ? "Planning..." : "Generate constrained code plan"}
          </button>
          <button
            onClick={() => decide("finalize_mvp_scope", `Founder selected ${scope}.`)}
            disabled={busy !== null || approval("finalize_mvp_scope")}
            className="rounded-xl border border-[#0066ff]/30 bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/20 px-3 py-2 text-xs font-bold transition-colors disabled:opacity-40"
          >
            Approve scope
          </button>
          <button
            onClick={buildSandbox}
            disabled={busy !== null || !approval("finalize_mvp_scope")}
            className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-3 py-2 text-xs font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:shadow-none"
          >
            {busy === "build" ? "Building..." : "Build private sandbox"}
          </button>
        </div>
        {Object.keys(mvp).length > 0 && (
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-black/[0.03] dark:bg-black/40 border border-black/[0.06] dark:border-white/10 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
            {JSON.stringify(mvp[scope] ?? mvp, null, 2)}
          </pre>
        )}
        {build && (
          <div className="mt-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 p-3 text-xs">
            <p className="flex items-center gap-2 font-bold text-[#171330] dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-[#20c937]" /> Build {build.status.replaceAll("_", " ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => openProtectedBlob("artifact")} className="rounded-lg border border-black/[0.08] dark:border-white/10 px-2.5 py-1 text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Download ZIP
              </button>
              <button onClick={() => openProtectedBlob("preview")} className="flex items-center gap-1 rounded-lg border border-black/[0.08] dark:border-white/10 px-2.5 py-1 text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Open preview <ExternalLink className="h-3 w-3" />
              </button>
              <button onClick={() => decide("create_repository", "Founder authorizes a restricted GitHub App to create a repository for this approved artifact.")} className="rounded-lg border border-black/[0.08] dark:border-white/10 px-2.5 py-1 text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Approve repository
              </button>
              <button onClick={() => decide("deploy_preview", "Founder authorizes a private preview deployment only.")} className="rounded-lg border border-black/[0.08] dark:border-white/10 px-2.5 py-1 text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Approve preview deploy
              </button>
              <button onClick={deployPreview} disabled={busy !== null || !approval("create_repository") || !approval("deploy_preview")} className="rounded-lg bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-2.5 py-1 text-white text-xs font-bold disabled:opacity-40">
                {busy === "deploy" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deploy preview"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
    <CollaboratorInviteDialog
      open={inviteOpen}
      onOpenChange={updateInviteOpen}
      project={{ ...project, id: project.id || session.projectId }}
      sessionId={session.id}
      onContinue={(draft) => navigate(`/matches?project=${encodeURIComponent(draft.projectId)}`)}
    />
    <ValidationStoryDialog
      open={storyOpen}
      onOpenChange={setStoryOpen}
      project={{ ...project, id: project.id || session.projectId }}
      sessionId={session.id}
    />
    </>
  );
}

function CompanyDimension({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#181818] p-3 shadow-sm">
      <p className="text-xs font-bold text-[#171330] dark:text-white">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">
        {typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
      </p>
    </div>
  );
}
