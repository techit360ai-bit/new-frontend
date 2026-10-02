import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Plus, Radio, Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useFounderProfile } from "@/contexts/UserContext";
import { createCustomerValidationSession, createCustomerValidationShare, createCustomerValidationSynthesis, draftCustomerValidationQuestions, fetchCustomerValidationFindings, fetchCustomerValidationRecommendations, fetchCustomerValidationSessions, transitionCustomerValidationSession, type CustomerValidationSession } from "@/lib/api/incubation";

const defaultQuestions = [
  { id: "q1", question: "Tell us about the last time you experienced this problem.", answer_type: "long_text", required: true },
  { id: "q2", question: "How do you currently handle it?", answer_type: "long_text", required: true },
  { id: "q3", question: "What is most frustrating about your current approach?", answer_type: "long_text", required: true },
];

export function CustomerValidationPanel() {
  const { founderProfile } = useFounderProfile();
  const project = founderProfile.founderProjects[0];
  const [sessions, setSessions] = useState<CustomerValidationSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("Customer Problem Discovery");
  const [objective, setObjective] = useState("problem_discovery");
  const [mode, setMode] = useState("survey");
  const [questions, setQuestions] = useState(defaultQuestions);
  const [findings, setFindings] = useState<{ whatWeLearned: string[]; whatRemainsUncertain: string[]; recurringPainPoints: Array<{ theme: string; count: number; share: number; quotes: string[] }> } | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{ id: string; title: string; reason: string; urgency: string; confidence: string; sourceEngines: string[]; status: string }>>([]);
  const active = useMemo(() => sessions.find((session) => session.status === "active"), [sessions]);

  const load = () => fetchCustomerValidationSessions().then((result) => setSessions(result.sessions || [])).catch(() => undefined);
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!active) return;
    const refresh = () => Promise.all([fetchCustomerValidationFindings(active.id), fetchCustomerValidationRecommendations(active.id)]).then(([nextFindings, nextRecommendations]) => { setFindings(nextFindings); setRecommendations(nextRecommendations.recommendations || []); }).catch(() => undefined);
    void refresh(); const timer = window.setInterval(() => { void load(); void refresh(); }, 5000); return () => window.clearInterval(timer);
  }, [active]);
  const create = async () => {
    if (!project?.id) { toast.error("Create or select a venture before starting validation"); return; }
    setBusy(true);
    try {
      await createCustomerValidationSession({ project_id: project.id, title, objective, mode, stage: project.stage, questions, target_respondents: 10 });
      await load(); toast.success("Validation round created");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create validation round"); }
    finally { setBusy(false); }
  };
  const draftQuestions = async () => { try { const result = await draftCustomerValidationQuestions({ objective, mode, stage: project?.stage, venture_context: project }); if (result.questions.length) setQuestions(result.questions); toast.success("AI questions drafted; review before activation"); } catch (error) { toast.error(error instanceof Error ? error.message : "Questions could not be drafted"); } };

  const transition = async (session: CustomerValidationSession, action: "activate" | "pause" | "complete") => {
    try { await transitionCustomerValidationSession(session.id, action); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update validation round"); }
  };

  const copyLink = async (session: CustomerValidationSession) => {
    if (!session.publicToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/validate/${session.publicToken}`);
    toast.success("Public validation link copied");
  };

  const synthesize = async (session: CustomerValidationSession) => { try { await createCustomerValidationSynthesis(session.id); await load(); toast.success("Findings refreshed from recorded evidence"); } catch (error) { toast.error(error instanceof Error ? error.message : "Synthesis could not be refreshed"); } };
  const share = async (session: CustomerValidationSession) => { try { const result = await createCustomerValidationShare(session.id, "public"); await navigator.clipboard.writeText(`${window.location.origin}/validation-evidence/${result.shareToken}`); toast.success("Public verified evidence summary link copied"); } catch (error) { toast.error(error instanceof Error ? error.message : "Evidence summary could not be shared"); } };
  const downloadQr = async (session: CustomerValidationSession) => { if (!session.publicToken) return; const dataUrl = await QRCode.toDataURL(`${window.location.origin}/validate/${session.publicToken}`, { width: 320, margin: 2 }); const link = document.createElement("a"); link.href = dataUrl; link.download = `validation-${session.id}.png`; link.click(); };

  return <section className="space-y-4 rounded-xl border border-violet-200 bg-surface-primary p-5 shadow-sm" aria-label="Customer Validation">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-text-primary">Customer Validation</h3><p className="text-sm text-text-muted">Collect immutable customer evidence inside this Incubation Hub.</p></div>{active && <span className="inline-flex items-center gap-1 rounded-full bg-status-success-soft px-3 py-1 text-xs font-semibold text-status-success"><Radio className="h-3 w-3" /> LIVE</span>}</div>
    <div className="grid gap-3 md:grid-cols-3"><input className="rounded-lg border p-2 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Validation title" /><select className="rounded-lg border p-2 text-sm" value={objective} onChange={(event) => setObjective(event.target.value)}><option value="problem_discovery">Problem Discovery</option><option value="solution_fit">Solution Fit</option><option value="willingness_to_pay">Willingness to Pay</option><option value="ux_feedback">UX Feedback</option></select><select className="rounded-lg border p-2 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}><option value="survey">Survey</option><option value="poll">Poll</option><option value="interview">Interview</option><option value="hybrid">Hybrid</option></select></div>
    <div className="space-y-2"><button type="button" onClick={() => void draftQuestions()} disabled={Boolean(active?.configurationLocked)} className="inline-flex min-h-10 items-center gap-2 rounded border px-3 text-xs">Draft stage-aware questions with AI</button>{questions.map((question, index) => <input key={question.id} className="w-full rounded-lg border p-2 text-sm" value={question.question} disabled={Boolean(active?.configurationLocked)} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} />)}</div>
    {!active && <button type="button" onClick={create} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Create validation round</button>}
    <div className="space-y-3">{sessions.map((session) => <div key={session.id} className="rounded-lg border border-border-default p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-text-primary">{session.title}</p><p className="text-xs capitalize text-text-muted">{session.objective.replaceAll("_", " ")} · {session.status}</p></div><div className="flex flex-wrap gap-2">{session.status === "draft" && <button type="button" onClick={() => void transition(session, "activate")} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><Play className="h-3 w-3" /> Activate</button>}{session.status === "active" && <button type="button" onClick={() => void transition(session, "pause")} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><Pause className="h-3 w-3" /> Pause</button>}{session.status === "paused" && <button type="button" onClick={() => void transition(session, "activate")} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><Play className="h-3 w-3" /> Resume</button>}{["active", "paused"].includes(session.status) && <button type="button" onClick={() => void transition(session, "complete")} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><Square className="h-3 w-3" /> Complete</button>}{session.publicToken && <button type="button" onClick={() => void copyLink(session)} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><Copy className="h-3 w-3" /> Share</button>}{session.publicToken && <button type="button" onClick={() => void downloadQr(session)} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs">QR</button>}{session.qualifiedResponseCount >= 3 && <button type="button" onClick={() => void synthesize(session)} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><CheckCircle2 className="h-3 w-3" /> Findings</button>}{session.qualifiedResponseCount >= 1 && <button type="button" onClick={() => void share(session)} className="inline-flex min-h-10 items-center gap-1 rounded border px-3 text-xs"><ExternalLink className="h-3 w-3" /> Evidence summary</button>}</div></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4"><div><span className="text-text-muted">Responses</span><strong className="block">{session.totalResponseCount}</strong></div><div><span className="text-text-muted">Qualified</span><strong className="block">{session.qualifiedResponseCount}</strong></div><div><span className="text-text-muted">Confidence</span><strong className="block capitalize">{session.confidenceLevel}</strong></div><div><span className="text-text-muted">Quality</span><strong className="block">{Object.values(session.qualityCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0)}</strong></div></div>{session.publicToken && <a className="mt-3 inline-flex items-center gap-1 text-xs text-violet-700" href={`/validate/${session.publicToken}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /> Open respondent view</a>}</div>)}</div>
    {findings && <div className="grid gap-4 md:grid-cols-2"><div className="rounded-lg bg-background-primary p-4"><h4 className="font-semibold">What Customers Are Telling You</h4><ul className="mt-2 space-y-1 text-sm text-text-secondary">{findings.whatWeLearned.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="rounded-lg bg-background-primary p-4"><h4 className="font-semibold">What Remains Uncertain</h4><ul className="mt-2 space-y-1 text-sm text-text-secondary">{findings.whatRemainsUncertain.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
    {recommendations.length > 0 && <div className="rounded-lg border border-status-warning bg-status-warning-soft p-4"><h4 className="font-semibold">What TechIT Recommends</h4><ul className="mt-2 space-y-2 text-sm">{recommendations.map((item) => <li key={item.id}><strong>{item.title}</strong><span className="ml-2 text-text-muted">{item.reason}</span><div className="text-xs text-text-muted">Sources: {item.sourceEngines.join(", ")} · {item.confidence} confidence</div></li>)}</ul></div>}
    {!sessions.length && <p className="rounded-lg bg-background-primary p-4 text-sm text-text-muted">No customer evidence rounds yet. Start with one real customer hypothesis.</p>}
  </section>;
}
