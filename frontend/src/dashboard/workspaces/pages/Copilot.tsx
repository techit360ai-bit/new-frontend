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

  return <div className="flex h-full flex-col bg-slate-50">
    <header className="border-b bg-white px-6 py-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-violet-100 p-2"><Brain className="h-5 w-5 text-violet-700" /></div><div><h1 className="font-bold text-slate-900">Workspace AI Copilot</h1><p className="text-xs text-slate-500">Context-aware guidance with human approval for consequential actions · autonomy capped at 60%</p></div></div></header>
    {!workspaceId && <div className="m-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Open Copilot from a project workspace URL containing <code>?ws=workspace-id</code>. Current route: {location.pathname}. Context cannot be injected without a workspace identity.</div>}
    <main className="flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-3xl space-y-4">
      {messages.length === 0 && <div className="rounded-xl border bg-white p-6 text-sm text-slate-600"><Bot className="mb-3 h-8 w-8 text-violet-600" /><p>Ask about the venture, founder answers, evidence, assumptions, decisions, MVP roadmap, tasks, milestones, code, or artifacts. The copilot may draft and recommend; it cannot silently commit or deploy.</p></div>}
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl p-4 text-sm ${message.role === "user" ? "bg-violet-600 text-white" : "border bg-white text-slate-700"}`}><div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">{message.role === "user" ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}{message.role === "user" ? "You" : "Workspace Copilot"}</div><p className="whitespace-pre-wrap">{message.content}</p></div></div>)}
      {loading && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Reading workspace context…</div>}
      {approval && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><ShieldAlert className="h-4 w-4" /> Human approval required</div><p className="mt-1 text-sm text-amber-800">The copilot drafted this request but executed nothing. Confirm “{approval.replaceAll("_", " ")}” through the relevant approval workflow.</p></div>}
    </div></main>
    <footer className="border-t bg-white p-4"><div className="mx-auto max-w-3xl space-y-3"><div className="grid gap-3 md:grid-cols-2"><ModelSelector value={model} onChange={setModel} taskType="workspace_conversation" /><label><span className="mb-1 block text-xs font-semibold text-slate-600">Intent</span><select value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">{ACTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div><div className="flex gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask the workspace copilot…" rows={2} className="flex-1 resize-none rounded-lg border border-slate-300 p-3 text-sm" /><button onClick={() => void send()} disabled={!canSend} className="rounded-lg bg-violet-600 px-4 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></div></div></footer>
  </div>;
}
