import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Paperclip, Send, Ticket } from "lucide-react";
import { createConversation, fetchConversations, fetchHistory, markConvRead, restSendDM } from "@/lib/messaging/conversations";
import { mapConvSummary, mapMessage } from "@/lib/messaging/map";
import type { UIConversation, UIMessage } from "@/lib/messaging/types";
import { useMessaging } from "@/contexts/MessagingProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function metaLine(conversation: Pick<UIConversation, "projectName" | "subject">): string {
  return [conversation.projectName, conversation.subject].filter(Boolean).join(" · ");
}

export function Messages() {
  const [convos, setConvos]       = useState<UIConversation[]>([]);
  const [activeId, setActiveId]   = useState<string>("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [sending, setSending]     = useState(false);
  const [draft, setDraft]         = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose state
  const [cRecipient, setCRecipient] = useState("");
  const [cSubject,   setCSubject]   = useState("");
  const [cBody,      setCBody]      = useState("");

  const { store, socket } = useMessaging();
  const { user } = useAuth();
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((list) => {
        if (!alive) return;
        const mapped = list.map(mapConvSummary);
        setConvos(mapped);
        setActiveId((current) => current || mapped[0]?.id || "");
      })
      .catch((err) => {
        if (!alive) return;
        setConvos([]);
        setActiveId("");
        setError(err instanceof Error ? err.message : "Live conversations are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    fetchHistory(activeId)
      .then((msgs) => {
        if (!alive || msgs.length === 0) return;
        const thread = msgs.slice().reverse().map((m) => mapMessage(m, user?.id ?? ""));
        setConvos((cur) => cur.map((c) => (c.id === activeId ? { ...c, thread } : c)));
        const latestMessageId = msgs[0]?.id;
        if (latestMessageId) {
          void markConvRead(activeId, latestMessageId).then(() => {
            if (!alive) return;
            setConvos((cur) => cur.map((c) => (c.id === activeId ? { ...c, unread: false } : c)));
          }).catch((err) => {
            if (alive) toast.error(err instanceof Error ? err.message : "Could not persist read state.");
          });
        }
      })
      .catch((err) => {
        if (alive) toast.error(err instanceof Error ? err.message : "Could not load conversation history.");
      });
    return () => { alive = false; };
  }, [activeId, user?.id]);
  useEffect(() => {
    if (!activeId) return;
    const live = store.threads[activeId];
    if (!live || live.length === 0) return;
    setConvos((cur) => cur.map((c) => {
      if (c.id !== activeId) return c;
      const seen = new Set(c.thread.map((m) => m.id));
      const merged = [...c.thread, ...live.filter((m) => !seen.has(m.id))];
      return { ...c, thread: merged };
    }));
  }, [store, activeId]);

  const active = convos.find((c) => c.id === activeId);
  const unreadCount = convos.filter((c) => c.unread).length;

  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  const appendMessage = (convId: string, msg: UIMessage) => {
    setConvos((cur) => cur.map((c) => c.id === convId ? { ...c, thread: [...c.thread, msg], subject: msg.body } : c));
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeId) return;
    const clientMsgId = `cm-${Date.now()}`;
    const msg: UIMessage = {
      id: clientMsgId, fromMe: true, authorName: "You",
      body: draft.trim(), timestamp: new Date().toISOString(),
    };
    const body = draft.trim();
    setSending(true);
    try {
      if (socket) {
        socket.send({ type: "message.send", data: { convId: activeId, clientMsgId, type: "text", body } });
        appendMessage(activeId, msg);
        setDraft("");
      } else {
        const sent = await restSendDM(activeId, clientMsgId, body);
        if (!sent) {
          toast.error("Message was not sent.");
        } else {
          appendMessage(activeId, { ...msg, id: sent.msgId || clientMsgId });
          setDraft("");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message was not sent.");
    } finally {
      setSending(false);
    }
  };

  const handleAttach = () => toast("Attachment uploads are not available yet.");

  const canCompose = Boolean(cRecipient.trim() && cSubject.trim() && cBody.trim());
  const resetCompose = () => { setCRecipient(""); setCSubject(""); setCBody(""); };

  const handleCompose = async () => {
    if (!canCompose) return;
    setSending(true);
    try {
      const recipient = cRecipient.trim();
      const convo = await createConversation(recipient);
      if (!convo?.id) {
        toast.error("Conversation was not created.");
        return;
      }
      const clientMsgId = `cm-${Date.now()}`;
      const sent = await restSendDM(convo.id, clientMsgId, cBody.trim());
      if (!sent) {
        toast.error("Message was not sent.");
        return;
      }
      const initials = cRecipient.trim().split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
      const newConvo: UIConversation = {
        id: convo.id,
        participantName: recipient,
        participantAvatar: initials,
        projectName: "",
        subject: cSubject.trim(),
        unread: false,
        thread: [{ id: sent.msgId || clientMsgId, fromMe: true, authorName: "You", body: cBody.trim(), timestamp: new Date().toISOString() }],
      };
      setConvos((cur) => [newConvo, ...cur]);
      setActiveId(newConvo.id);
      setComposeOpen(false);
      resetCompose();
      toast("Message sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message was not sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 lg:p-8 pb-4 max-w-6xl mx-auto w-full flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? "Loading live conversations..." : `${convos.length} conversations · ${unreadCount} unread`}</p>
        </div>
        <div className="flex items-center gap-2"><Link to="/support" className="app-touch-target inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" aria-label="Open support tickets"><Ticket className="h-4 w-4" />Support</Link><button onClick={() => setComposeOpen(true)} className="h-9 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold">Compose</button></div>
      </div>

      <div className="flex-1 px-6 lg:px-8 pb-6 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Inbox */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {loading && <li className="p-4 text-sm text-slate-500">Loading live conversations...</li>}
              {!loading && error && (
                <li className="p-4 text-sm text-red-600">Live conversations are unavailable: {error}</li>
              )}
              {!loading && !error && convos.length === 0 && (
                <li className="p-4 text-sm text-slate-500">No live conversations yet.</li>
              )}
              {convos.map((c) => (
                <li key={c.id}>
                  <button onClick={() => handleSelect(c.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${c.id === activeId ? "bg-amber-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-sm shrink-0">{c.participantAvatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {c.unread && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.participantName}</p>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{metaLine(c) || "Conversation"}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{c.thread[c.thread.length - 1]?.body}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversation pane */}
          <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl flex flex-col overflow-hidden">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Select a conversation</div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{active.participantName}</p>
                  <p className="text-xs text-slate-500">{metaLine(active) || "Conversation"}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {active.thread.map((m) => (
                    <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-3 py-2 rounded-lg text-sm ${m.fromMe ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-900"}`}>
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${m.fromMe ? "text-slate-800/70" : "text-slate-500"}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-3 flex items-end gap-2">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply…"
                    rows={2}
                    className="flex-1 resize-none border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                  <button onClick={handleAttach} className="h-9 w-9 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center justify-center"><Paperclip className="w-4 h-4" /></button>
                  <button onClick={() => void handleSend()} disabled={!draft.trim() || sending}
                    className="h-9 px-4 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={(o) => { setComposeOpen(o); if (!o) resetCompose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">To</label>
              <input value={cRecipient} onChange={(e) => setCRecipient(e.target.value)} placeholder="Recipient user ID"
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
              <input value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="Quick question"
                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Body</label>
              <textarea value={cBody} onChange={(e) => setCBody(e.target.value)} rows={4}
                className="w-full resize-none border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setComposeOpen(false)} className="px-4 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={() => void handleCompose()} disabled={!canCompose || sending}
              className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400">{sending ? "Sending..." : "Send"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
