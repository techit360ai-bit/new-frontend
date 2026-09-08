import { useEffect, useMemo, useState } from "react";
import { Bot, Brain, Loader2, Send, ShieldAlert, UserRound } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ModelSelector } from "@/dashboard/founders/section/components/incubation/ModelSelector";
import { converseWithWorkspace, type WorkspaceConversationMessage } from "../lib/api/workspaceAI";

const ACTIONS = [
  ["", "Discuss only"], ["validate_idea", "Validate idea"], ["accept_assumption", "Accept assumption"],
  ["finalize_mvp_scope", "Finalize MVP scope"], ["commit_roadmap", "Commit roadmap"],
  ["create_repository", "Create repository"], ["deploy_preview", "Deploy preview"],
  ["deploy_production", "Deploy production"], ["publish_investor", "Publish to investors"],
];

export function Copilot() {
  const [params] = useSearchParams();
  const location = useLocation();
  const workspaceId = params.get("ws") ?? "";
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<WorkspaceConversationMessage[]>([]);
  const [model, setModel] = useState("");
  const [requestedAction, setRequestedAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<string | null>(null);
  const storageKey = workspaceId ? `techit-workspace-copilot:${workspaceId}` : "";
  const canSend = useMemo(() => Boolean(workspaceId && draft.trim() && !loading), [workspaceId, draft, loading]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) setMessages(stored.slice(-40));
    } catch { /* ignore malformed local session history */ }
  }, [storageKey]);

  const send = async () => {
    if (!canSend) return;
    const content = draft.trim();
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setDraft(""); setLoading(true); setApproval(null);
    try {
      const response = await converseWithWorkspace({ workspace_id: workspaceId, message: content, messages, requested_action: requestedAction || undefined, model_id: model || undefined });
      if (!response) throw new Error("Workspace Copilot returned no response");
      const completed = [...next, { role: "assistant" as const, content: response.message }];
      setMessages(completed);
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(completed.slice(-40)));
      if (response.approval_required) setApproval(response.approval_action ?? requestedAction);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Copilot request failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white transition-colors">
      <header className="border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 p-2.5 border border-[#0066ff]/20">
            <Brain className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-lg">Workspace AI Copilot</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Context-aware guidance with human approval for consequential actions · autonomy capped at 60%</p>
          </div>
        </div>
      </header>
      {!workspaceId && (
        <div className="m-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          Open Copilot from a project workspace URL containing <code>?ws=workspace-id</code>. Current route: {location.pathname}. Context cannot be injected without a workspace identity.
        </div>
      )}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
              <Bot className="mb-3 h-8 w-8 text-[#0066ff] dark:text-[#58a6ff]" />
              <p className="leading-relaxed">Ask about the venture, founder answers, evidence, assumptions, decisions, MVP roadmap, tasks, milestones, code, or artifacts. The copilot may draft and recommend; it cannot silently commit or deploy.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]"
                  : "border border-black/[0.06] dark:border-white/10 bg-white/90 dark:bg-[#1a1a1a] text-slate-900 dark:text-white shadow-sm"
              }`}>
                <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                  {message.role === "user" ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  {message.role === "user" ? "You" : "Workspace Copilot"}
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#0066ff] dark:text-[#58a6ff]" /> Reading workspace context…
            </div>
          )}
          {approval && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4" /> Human approval required
              </div>
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">The copilot drafted this request but executed nothing. Confirm “{approval.replaceAll("_", " ")}” through the relevant approval workflow.</p>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <ModelSelector value={model} onChange={setModel} taskType="workspace_conversation" />
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Intent</span>
              <select value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0066ff]">
                {ACTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
              placeholder="Ask the workspace copilot…"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
            />
            <button
              onClick={() => void send()}
              disabled={!canSend}
              className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-5 text-white font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
