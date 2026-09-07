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

  return (
    <section className="space-y-5 rounded-3xl border border-[#0066ff]/15 dark:border-white/10 bg-white dark:bg-[#121212]/90 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl" aria-label="Customer Validation">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#171330] dark:text-white tracking-tight">Customer Validation</h3>
          <p className="text-sm text-[#171330]/60 dark:text-white/60">Collect immutable customer evidence inside this Incubation Hub.</p>
        </div>
        {active && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#20c937]/15 border border-[#20c937]/30 px-3.5 py-1 text-xs font-black text-[#20c937] shadow-[0_0_12px_rgba(32,201,55,0.25)]">
            <Radio className="h-3 w-3 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input 
          className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f8ff] dark:bg-white/[0.04] p-3 text-sm text-[#171330] dark:text-white placeholder:text-[#171330]/40 dark:placeholder:text-white/40 focus:border-[#0066ff] dark:focus:border-[#58a6ff] outline-none transition-colors" 
          value={title} 
          onChange={(event) => setTitle(event.target.value)} 
          placeholder="Validation title" 
        />
        <select 
          className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f8ff] dark:bg-[#1a1a1a] p-3 text-sm text-[#171330] dark:text-white focus:border-[#0066ff] dark:focus:border-[#58a6ff] outline-none transition-colors" 
          value={objective} 
          onChange={(event) => setObjective(event.target.value)}
        >
          <option value="problem_discovery">Problem Discovery</option>
          <option value="solution_fit">Solution Fit</option>
          <option value="willingness_to_pay">Willingness to Pay</option>
          <option value="ux_feedback">UX Feedback</option>
        </select>
        <select 
          className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f8ff] dark:bg-[#1a1a1a] p-3 text-sm text-[#171330] dark:text-white focus:border-[#0066ff] dark:focus:border-[#58a6ff] outline-none transition-colors" 
          value={mode} 
          onChange={(event) => setMode(event.target.value)}
        >
          <option value="survey">Survey</option>
          <option value="poll">Poll</option>
          <option value="interview">Interview</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div className="space-y-2">
        <button 
          type="button" 
          onClick={() => void draftQuestions()} 
          disabled={Boolean(active?.configurationLocked)} 
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#0066ff]/25 dark:border-[#58a6ff]/30 bg-[#0066ff]/5 dark:bg-[#0066ff]/15 px-3.5 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/10 transition-colors disabled:opacity-50"
        >
          Draft stage-aware questions with AI
        </button>
        {questions.map((question, index) => (
          <input 
            key={question.id} 
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f8ff] dark:bg-white/[0.04] p-3 text-sm text-[#171330] dark:text-white outline-none focus:border-[#0066ff] dark:focus:border-[#58a6ff] transition-colors" 
            value={question.question} 
            disabled={Boolean(active?.configurationLocked)} 
            onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} 
          />
        ))}
      </div>

      {!active && (
        <button 
          type="button" 
          onClick={create} 
          disabled={busy} 
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.3)] hover:from-[#0052cc] hover:to-[#408fe6] transition-all disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Create validation round
        </button>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#0066ff]/[0.02] dark:bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-base text-[#171330] dark:text-white">{session.title}</p>
                <p className="text-xs capitalize text-[#171330]/50 dark:text-white/50">{session.objective.replaceAll("_", " ")} · {session.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.status === "draft" && (
                  <button type="button" onClick={() => void transition(session, "activate")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    <Play className="h-3 w-3" /> Activate
                  </button>
                )}
                {session.status === "active" && (
                  <button type="button" onClick={() => void transition(session, "pause")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    <Pause className="h-3 w-3" /> Pause
                  </button>
                )}
                {session.status === "paused" && (
                  <button type="button" onClick={() => void transition(session, "activate")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    <Play className="h-3 w-3" /> Resume
                  </button>
                )}
                {["active", "paused"].includes(session.status) && (
                  <button type="button" onClick={() => void transition(session, "complete")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    <Square className="h-3 w-3" /> Complete
                  </button>
                )}
                {session.publicToken && (
                  <button type="button" onClick={() => void copyLink(session)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    <Copy className="h-3 w-3" /> Share
                  </button>
                )}
                {session.publicToken && (
                  <button type="button" onClick={() => void downloadQr(session)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 text-xs font-semibold text-[#171330] dark:text-white hover:bg-[#0066ff]/10 hover:text-[#0066ff] transition-colors">
                    QR
                  </button>
                )}
                {session.qualifiedResponseCount >= 3 && (
                  <button type="button" onClick={() => void synthesize(session)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#0066ff]/30 bg-[#0066ff]/10 px-3 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/20 transition-colors">
                    <CheckCircle2 className="h-3 w-3" /> Findings
                  </button>
                )}
                {session.qualifiedResponseCount >= 1 && (
                  <button type="button" onClick={() => void share(session)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#20c937]/30 bg-[#20c937]/10 px-3 text-xs font-bold text-[#20c937] hover:bg-[#20c937]/20 transition-colors">
                    <ExternalLink className="h-3 w-3" /> Evidence summary
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-3 border border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs font-medium text-[#171330]/50 dark:text-white/50">Responses</span>
                <strong className="block text-lg font-black text-[#171330] dark:text-white">{session.totalResponseCount}</strong>
              </div>
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-3 border border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs font-medium text-[#171330]/50 dark:text-white/50">Qualified</span>
                <strong className="block text-lg font-black text-[#171330] dark:text-white">{session.qualifiedResponseCount}</strong>
              </div>
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-3 border border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs font-medium text-[#171330]/50 dark:text-white/50">Confidence</span>
                <strong className="block text-lg font-black capitalize text-[#0066ff] dark:text-[#58a6ff]">{session.confidenceLevel}</strong>
              </div>
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-3 border border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs font-medium text-[#171330]/50 dark:text-white/50">Quality</span>
                <strong className="block text-lg font-black text-[#20c937]">{Object.values(session.qualityCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0)}</strong>
              </div>
            </div>

            {session.publicToken && (
              <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] hover:underline" href={`/validate/${session.publicToken}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Open respondent view
              </a>
            )}
          </div>
        ))}
      </div>

      {findings && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#0066ff]/[0.03] dark:bg-white/[0.03] border border-[#0066ff]/10 dark:border-white/10 p-5">
            <h4 className="font-bold text-[#171330] dark:text-white">What Customers Are Telling You</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-[#171330]/80 dark:text-white/80">
              {findings.whatWeLearned.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-[#0066ff] dark:text-[#58a6ff] font-black">•</span> {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#0066ff]/[0.03] dark:bg-white/[0.03] border border-[#0066ff]/10 dark:border-white/10 p-5">
            <h4 className="font-bold text-[#171330] dark:text-white">What Remains Uncertain</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-[#171330]/80 dark:text-white/80">
              {findings.whatRemainsUncertain.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-[#58a6ff] font-black">•</span> {item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-[#0066ff]/20 dark:border-[#58a6ff]/20 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/5 dark:from-[#0066ff]/15 dark:to-transparent p-5">
          <h4 className="font-bold text-[#171330] dark:text-white mb-3">What TechIT Recommends</h4>
          <ul className="space-y-3 text-sm">
            {recommendations.map((item) => (
              <li key={item.id} className="border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5 last:border-0 last:pb-0">
                <strong className="text-[#0066ff] dark:text-[#58a6ff]">{item.title}</strong>
                <span className="ml-2 text-[#171330]/80 dark:text-white/80">{item.reason}</span>
                <div className="text-xs text-[#171330]/50 dark:text-white/50 mt-1">Sources: {item.sourceEngines.join(", ")} · {item.confidence} confidence</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!sessions.length && (
        <p className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/10 p-5 text-sm text-[#171330]/50 dark:text-white/50 text-center">
          No customer evidence rounds yet. Start with one real customer hypothesis.
        </p>
      )}
    </section>
  );
}
