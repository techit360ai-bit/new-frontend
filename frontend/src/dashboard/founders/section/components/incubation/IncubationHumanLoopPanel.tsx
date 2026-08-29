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
    <section className="mb-6 space-y-4 rounded-xl border border-violet-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-bold text-slate-900">Founder Validation & Human Decisions</h3><p className="text-xs text-slate-500">AI autonomy is capped at 60%. Scores and plans remain provisional until you approve them.</p></div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{session.status.replaceAll("_", " ")}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CircleHelp className="h-4 w-4 text-violet-600" /> Founder questions</h4>
          <div className="space-y-3">
            {questions.map((question) => <label key={question.id} className="block"><span className="text-xs font-medium text-slate-700">{question.question}</span>{question.why_it_matters && <span className="mt-1 block text-[11px] text-slate-500">{question.why_it_matters}</span>}<textarea value={answers[question.id] ?? ""} onChange={(event) => setAnswers((old) => ({ ...old, [question.id]: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" /></label>)}
          </div>
          <button onClick={saveAnswers} disabled={busy !== null || questions.length === 0} className="mt-3 rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy === "answers" ? "Saving..." : `Save answers (${unanswered} incomplete)`}</button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4"><h4 className="flex items-center gap-2 text-sm font-semibold"><Search className="h-4 w-4 text-violet-600" /> Evidence, competitors and failures</h4><p className="mt-2 text-xs text-slate-500">Research mode: {String(evidence.research_mode ?? "pending")}. Synthetic/model knowledge is never presented as customer validation.</p><ul className="mt-2 space-y-1 text-xs text-slate-700">{sources.slice(0, 5).map((source, index) => <li key={String(source.url ?? index)}><a className="text-violet-700 underline" href={String(source.url)} target="_blank" rel="noreferrer">{String(source.title ?? source.url)}</a> · {String(source.geography ?? "geography not supplied")}</li>)}</ul>{contradictions.length > 0 && <p className="mt-2 flex gap-1 text-xs text-amber-700"><AlertTriangle className="h-4 w-4" /> {contradictions.length} contradictory evidence item(s) require review.</p>}</div>
          <div className="rounded-lg border border-slate-200 p-4"><h4 className="flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4 text-violet-600" /> Geography</h4><pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-xs text-slate-600">{JSON.stringify(geography.primary_geography ?? geography, null, 2)}</pre></div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-semibold">Evidence-backed PMF verdict</h4><p className="text-xs text-slate-500">The AI can challenge assumptions and propose a verdict; only a human can mark the idea validated.</p></div><button onClick={validatePMF} disabled={busy !== null} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{busy === "pmf" ? "Testing..." : "Run PMF falsification"}</button></div>
        {Object.keys(pmf).length > 0 && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs">{JSON.stringify(pmf, null, 2)}</pre>}
        <button onClick={() => decide("validate_idea", "Founder reviewed the questions, evidence, contradictions and falsification tests.")} disabled={busy !== null || approval("validate_idea")} className="mt-3 flex items-center gap-2 rounded-md border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-40"><ShieldCheck className="h-4 w-4" /> {approval("validate_idea") ? "Human validation recorded" : "I approve the validation decision"}</button>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
        <h4 className="text-sm font-semibold text-indigo-950">Build a company, not only a product</h4>
        <p className="mt-1 text-xs text-indigo-800">The first product is the wedge. Company validation tests recurring customer value, repeatable distribution, an operating model, business model, expansion and a compounding advantage.</p>
        {Object.keys(company).length > 0 ? <div className="mt-3 grid gap-3 md:grid-cols-2"><CompanyDimension label="Company thesis" value={company.company_thesis} /><CompanyDimension label="Product wedge" value={company.wedge} /><CompanyDimension label="Repeatability" value={company.repeatability} /><CompanyDimension label="Distribution" value={company.distribution} /><CompanyDimension label="Operating model" value={company.operating_model} /><CompanyDimension label="Defensibility" value={company.defensibility} /></div> : <p className="mt-3 text-xs text-slate-500">Company-building analysis will appear after the validation session starts.</p>}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4 text-violet-600" /> MVP scope, code plan and private preview</h4>
        <div className="mt-3 flex flex-wrap gap-2">{[["one_day_prototype", "1 day"], ["three_day_demo", "3 days"], ["one_week_mvp", "1 week"], ["production_mvp_2_to_6_weeks", "2–6 weeks"]].map(([id, label]) => <button key={id} onClick={() => setScope(id)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${scope === id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>)}</div>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={planMvp} disabled={busy !== null} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{busy === "mvp" ? "Planning..." : "Generate constrained code plan"}</button><button onClick={() => decide("finalize_mvp_scope", `Founder selected ${scope}.`)} disabled={busy !== null || approval("finalize_mvp_scope")} className="rounded-md border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-800">Approve scope</button><button onClick={buildSandbox} disabled={busy !== null || !approval("finalize_mvp_scope")} className="rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy === "build" ? "Building..." : "Build private sandbox"}</button></div>
        {Object.keys(mvp).length > 0 && <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs">{JSON.stringify(mvp[scope] ?? mvp, null, 2)}</pre>}
        {build && <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Build {build.status.replaceAll("_", " ")}</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => openProtectedBlob("artifact")} className="rounded border px-2 py-1">Download ZIP</button><button onClick={() => openProtectedBlob("preview")} className="flex items-center gap-1 rounded border px-2 py-1">Open preview <ExternalLink className="h-3 w-3" /></button><button onClick={() => decide("create_repository", "Founder authorizes a restricted GitHub App to create a repository for this approved artifact.")} className="rounded border px-2 py-1">Approve repository</button><button onClick={() => decide("deploy_preview", "Founder authorizes a private preview deployment only.")} className="rounded border px-2 py-1">Approve preview deploy</button><button onClick={deployPreview} disabled={busy !== null || !approval("create_repository") || !approval("deploy_preview")} className="rounded bg-violet-600 px-2 py-1 text-white disabled:opacity-40">{busy === "deploy" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deploy preview"}</button></div></div>}
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
  return <div className="rounded-md border border-indigo-100 bg-white p-3"><p className="text-xs font-semibold text-indigo-900">{label}</p><p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}</p></div>;
}
