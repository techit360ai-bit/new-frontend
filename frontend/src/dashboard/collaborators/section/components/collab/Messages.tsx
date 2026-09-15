import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Paperclip, Send, Ticket, MessageSquare, Plus, CheckCheck, Sparkles, User, Inbox } from "lucide-react";
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
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="p-6 lg:p-8 pb-4 max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Direct Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {loading ? "Loading live conversations..." : `${convos.length} conversations · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/support"
            className="h-10 px-3.5 text-xs font-semibold inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#181818] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <Ticket className="h-4 w-4 text-[#0066ff]" />
            <span>Support</span>
          </Link>
          <button
            onClick={() => setComposeOpen(true)}
            className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 pb-6 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Inbox List */}
          <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-y-auto shadow-sm">
            <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {loading && <li className="p-5 text-xs text-slate-500 dark:text-slate-400">Loading live conversations...</li>}
              {!loading && error && (
                <li className="p-5 text-xs text-red-600 dark:text-red-400">Live conversations are unavailable: {error}</li>
              )}
              {!loading && !error && convos.length === 0 && (
                <li className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
                  No live conversations yet.
                </li>
              )}
              {convos.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors ${
                      c.id === activeId ? "bg-[#20C997]/10 dark:bg-[#20C997]/15 border-l-2 border-[#20C997]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20C997] to-[#128a64] text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {c.participantAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.participantName}</p>
                          {c.unread && <span className="w-2 h-2 rounded-full bg-[#20C997] shrink-0 animate-pulse"></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{metaLine(c) || "Conversation"}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{c.thread[c.thread.length - 1]?.body}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversation Pane */}
          <div className="md:col-span-2 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400 p-6">
                <MessageSquare className="w-10 h-10 text-slate-400/40 mb-2" />
                Select a conversation to view messages
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/[0.02]">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{active.participantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{metaLine(active) || "Direct Message"}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                  {active.thread.map((m) => (
                    <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          m.fromMe
                            ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-sm rounded-br-none"
                            : "bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-slate-100 border border-black/[0.04] dark:border-white/[0.06] rounded-bl-none"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 text-right ${m.fromMe ? "text-white/70" : "text-slate-400"}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/[0.06] dark:border-white/10 p-3.5 flex items-end gap-2 bg-slate-50/30 dark:bg-white/[0.01]">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    rows={2}
                    className="flex-1 resize-none border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-[#181818] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  />
                  <button
                    onClick={handleAttach}
                    className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() || sending}
                    className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={(o) => { setComposeOpen(o); if (!o) resetCompose(); }}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Recipient User ID</label>
              <input
                value={cRecipient}
                onChange={(e) => setCRecipient(e.target.value)}
                placeholder="User ID or identifier"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
              <input
                value={cSubject}
                onChange={(e) => setCSubject(e.target.value)}
                placeholder="Topic or Project"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
              <textarea
                value={cBody}
                onChange={(e) => setCBody(e.target.value)}
                rows={4}
                placeholder="Write your message..."
                className="w-full resize-none border border-black/[0.08] dark:border-white/10 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              onClick={() => setComposeOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCompose()}
              disabled={!canCompose || sending}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] disabled:opacity-50 transition-all"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
