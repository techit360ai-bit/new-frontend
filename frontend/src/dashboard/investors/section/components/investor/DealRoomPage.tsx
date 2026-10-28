import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileQuestion, FolderOpen, LockKeyhole, MessageSquare, NotebookPen, PackageCheck, Send, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  createDealInternalNote, createDealQuestion, downloadDealDocument, generateInvestorPack,
  getClosingReadiness, getComparableTransactions, getDealDocuments, getDealFolders,
  getDealQuestionnaire, getDealTeam, getDealTermSheets, getInvestorDeal, getRevenueVerification,
  getTechnicalDd, saveDealQuestionnaire, signDealNda, transitionInvestorDeal,
  updateDiligenceItem, verifyDealAuditIntegrity, type DealRoomDetail, type DealState,
} from "@/lib/api/investorDeals";

type Row = Record<string, unknown>;

export function DealRoomPage() {
  const { dealId } = useParams();
  const [data, setData] = useState<DealRoomDetail | null>(null);
  const [question, setQuestion] = useState("");
  const [note, setNote] = useState("");
  const [questionnaire, setQuestionnaire] = useState<Row | null>(null);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [folders, setFolders] = useState<Row[]>([]);
  const [team, setTeam] = useState<Row[]>([]);
  const [termSheets, setTermSheets] = useState<Row[]>([]);
  const [comparables, setComparables] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row | null>(null);
  const [technical, setTechnical] = useState<Row | null>(null);
  const [revenue, setRevenue] = useState<Row | null>(null);
  const [closing, setClosing] = useState<Row | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!dealId) return;
    getInvestorDeal(dealId).then(setData).catch(() => setData(null));
    getDealDocuments(dealId).then((result) => setDocuments(result.documents || [])).catch(() => setDocuments([]));
    getDealFolders(dealId).then((result) => setFolders(result.folders || [])).catch(() => setFolders([]));
    getDealTeam(dealId).then((result) => setTeam(Array.isArray(result.participants) ? result.participants : Array.isArray(result.team) ? result.team : [])).catch(() => setTeam([]));
    getDealTermSheets(dealId).then((result) => setTermSheets(result.termSheets || [])).catch(() => setTermSheets([]));
    getComparableTransactions().then((result) => setComparables(result.comparables || [])).catch(() => setComparables([]));
    verifyDealAuditIntegrity(dealId).then(setAudit).catch(() => setAudit(null));
    getDealQuestionnaire(dealId).then((result) => {
      setQuestionnaire(result);
      const submission = result.submission as { answers?: Record<string, unknown> } | null;
      if (submission?.answers) setAnswers(submission.answers);
    }).catch(() => setQuestionnaire(null));
    getTechnicalDd(dealId).then(setTechnical).catch(() => setTechnical(null));
    getRevenueVerification(dealId).then(setRevenue).catch(() => setRevenue(null));
    getClosingReadiness(dealId).then(setClosing).catch(() => setClosing(null));
  };

  useEffect(load, [dealId]);
  if (!data) return <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-8 text-slate-500 dark:text-slate-400">Loading Deal Room...</div>;

  const deal = data.deal;
  const sign = async () => { setBusy(true); try { await signDealNda(deal.id); toast.success("NDA signed. Protected diligence access is now enabled."); load(); } catch { toast.error("NDA signature could not be recorded."); } finally { setBusy(false); } };
  const move = async (state: DealState) => { try { await transitionInvestorDeal(deal.id, state); toast.success(`Deal moved to ${state}.`); load(); } catch { toast.error("That Deal Room transition is not allowed."); } };
  const saveQuestion = async () => { if (!question.trim()) return; try { await createDealQuestion(deal.id, question); setQuestion(""); toast.success("Question submitted."); load(); } catch { toast.error("Unable to submit question."); } };
  const saveNote = async () => { if (!note.trim()) return; try { await createDealInternalNote(deal.id, note); setNote(""); toast.success("Internal note saved."); load(); } catch { toast.error("Unable to save internal note."); } };
  const saveQuestionnaire = async (submit: boolean) => { try { await saveDealQuestionnaire(deal.id, answers, submit); toast.success(submit ? "Questionnaire submitted." : "Questionnaire saved."); load(); } catch { toast.error("Questionnaire update rejected."); } };
  const openDocument = async (id: string) => { try { const result = await downloadDealDocument(deal.id, id); if (result.downloadUrl) window.open(result.downloadUrl, "_blank", "noopener,noreferrer"); else toast.error("This document has no private access URL."); } catch { toast.error("Document access rejected."); } };
  const pack = async () => { try { await generateInvestorPack(deal.id); toast.success("Investor Pack generated from labelled Deal Room data."); } catch { toast.error("Investor Pack could not be generated."); } };
  const checklistQuestions = ((questionnaire?.template as { questions?: Array<{ key: string; prompt: string }> } | undefined)?.questions || []);
  const closingItems = Array.isArray((closing as { items?: unknown[] } | null)?.items) ? ((closing as { items: unknown[] }).items.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-4 text-slate-900 dark:text-white sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/investor/deals" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#20C997] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Deal Pipeline
        </Link>

        {/* Top Header Card */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-[#20C997]">Deal Room Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Project {deal.projectId}</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              State: <span className="font-mono font-bold text-[#20C997]">{deal.state}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            {deal.ndaSigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#20C997]/15 text-[#20C997] rounded-full text-xs font-bold border border-[#20C997]/20">
                <ShieldCheck className="h-4 w-4" /> NDA Signed & Active
              </span>
            ) : (
              <button disabled={busy} onClick={sign} className="inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1cb084] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all">
                <LockKeyhole className="h-4 w-4" /> Sign NDA to open diligence
              </button>
            )}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">{deal.diligence.completed}/{deal.diligence.total} checklist items complete</p>
          </div>
        </div>

        {!deal.ndaSigned ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-700 dark:text-amber-300 font-medium">
            This Deal Room is access-controlled. Sign the current NDA before viewing protected diligence data.
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <CheckCircle2 className="h-4 w-4 text-[#20C997]" /> Diligence Checklist
                </h2>
                <div className="space-y-3">
                  {data.checklist.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/5 pb-3 last:border-0">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.category}</p>
                      </div>
                      <select
                        value={item.status}
                        onChange={async (e) => { try { await updateDiligenceItem(deal.id, item.id, { status: e.target.value }); load(); } catch { toast.error("Checklist update rejected."); } }}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                      >
                        <option>not_started</option>
                        <option>requested</option>
                        <option>submitted</option>
                        <option>under_review</option>
                        <option>accepted</option>
                        <option>needs_clarification</option>
                        <option>waived</option>
                      </select>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <MessageSquare className="h-4 w-4 text-[#20C997]" /> Deal Room Q&amp;A
                </h2>
                <div className="space-y-3">
                  {data.questions.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No questions submitted yet.</p>}
                  {data.questions.map((item) => (
                    <div key={String(item.id)} className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3.5">
                      <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-medium">{String(item.content)}</p>
                      <p className="mt-1 text-[10px] text-[#20C997] font-semibold uppercase">{String(item.status || "open")}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a diligence question"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                  />
                  <button onClick={saveQuestion} className="rounded-xl bg-[#20C997] hover:bg-[#1cb084] px-3.5 text-slate-950 font-bold">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <FolderOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Secure Data Room
                </h2>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Private, scanned, versioned evidence. Access is recorded.</p>
                <div className="space-y-2">
                  {documents.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No evidence uploaded yet.</p>}
                  {documents.map((item) => (
                    <div key={String(item.id)} className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/5 pb-2.5">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{String(item.name)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{String(item.category)} · {String(item.status)}</p>
                      </div>
                      {item.status === "available" && (
                        <button onClick={() => openDocument(String(item.id))} className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10">
                          <Download className="mr-1 inline h-3 w-3" /> Open
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <FileQuestion className="h-4 w-4 text-[#20C997]" /> Investor Questionnaire
                </h2>
                {checklistQuestions.map((item) => (
                  <label key={item.key} className="mb-3 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {item.prompt}
                    <textarea
                      value={String(answers[item.key] || "")}
                      onChange={(e) => setAnswers((current) => ({ ...current, [item.key]: e.target.value }))}
                      className="mt-1 min-h-16 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                    />
                  </label>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => saveQuestionnaire(false)} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Save Draft
                  </button>
                  <button onClick={() => saveQuestionnaire(true)} className="rounded-xl bg-[#20C997] hover:bg-[#1cb084] px-4 py-2 text-xs font-bold text-slate-950 shadow-sm">
                    Submit Questionnaire
                  </button>
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> Technical DD
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">CodebaseAnalysisEngine</p>
                <p className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {String(technical?.report ? (technical.report as { freshness?: string }).freshness : technical?.reason || "Unavailable")}
                </p>
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-2 font-bold text-slate-900 dark:text-white text-base">Revenue Verification</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aggregate-only telemetry.</p>
                <p className="mt-3 text-xs sm:text-sm font-mono font-bold text-[#20C997]">
                  {String(revenue?.verification ? (revenue.verification as { status?: string }).status : "unverified")}
                </p>
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <PackageCheck className="h-4 w-4 text-[#20C997]" /> Closing Readiness
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {closing?.ready ? "Ready for closing review" : "Outstanding conditions remain"}
                </p>
                <button onClick={pack} className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10">
                  Generate Investor Pack
                </button>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-slate-900 dark:text-white text-base">Deal Room Controls</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Folders</p>
                    <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">{folders.length}</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Participants</p>
                    <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">{team.length}</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Audit Chain</p>
                    <p className="mt-1 text-xs font-bold text-[#20C997]">
                      {audit?.valid === false ? "Review required" : audit ? "Verified" : "Unavailable"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-2 font-bold text-slate-900 dark:text-white text-base">Term Sheet &amp; Comparables</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Versioned term-sheet state and privacy-safe comparables.</p>
                <div className="flex flex-wrap gap-2.5 text-xs">
                  <span className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">Term sheets: {termSheets.length}</span>
                  <span className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">Comparables: {comparables.length}</span>
                  <span className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">Closing items: {closingItems}</span>
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <NotebookPen className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Investor Internal Notes
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Private to the investor and never exposed to founders.</p>
              <div className="space-y-2 mb-4">
                {data.notes.map((item) => (
                  <div key={String(item.id)} className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3.5 text-xs text-slate-700 dark:text-slate-300">
                    {String(item.content)}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record an internal diligence note"
                  className="min-h-20 min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                />
                <button onClick={saveNote} className="self-end rounded-xl bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 px-3.5 py-2.5 text-white font-bold">
                  <FileQuestion className="h-4 w-4" />
                </button>
              </div>
            </section>

            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => move("diligence_complete")} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10">
                Mark Diligence Complete
              </button>
              <button onClick={() => move("ic_review")} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10">
                Send to IC Review
              </button>
              <button onClick={() => move("passed")} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20">
                Pass Deal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
