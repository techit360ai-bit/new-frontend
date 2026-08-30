import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Paperclip, Send, Ticket } from "lucide-react";
import { acceptMessageRequest, createConversation, declineMessageRequest, fetchConversations, fetchHistory, markConvRead, restSendDM } from "@/lib/messaging/conversations";
import { mapConvSummary, mapMessage } from "@/lib/messaging/map";
import type { MessageIdentity, UIConversation, UIMessage } from "@/lib/messaging/types";
import { useMessaging } from "@/contexts/MessagingProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RecipientSearch } from "@/components/messaging/RecipientSearch";
import { MentionTextarea } from "@/components/messaging/MentionTextarea";
import { MentionText } from "@/components/messaging/MentionText";
import { IdentityBadges } from "@/components/messaging/IdentityBadges";

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
  const [cRecipient, setCRecipient] = useState<MessageIdentity | null>(null);
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
  const respondToRequest = async (status: "active" | "declined") => {
    if (!active) return;
    try { if (status === "active") await acceptMessageRequest(active.id); else await declineMessageRequest(active.id); setConvos(current => current.map(item => item.id === active.id ? { ...item, requestStatus: status } : item)); toast(status === "active" ? "Message request accepted" : "Message request declined"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Request could not be updated."); }
  };

  const canCompose = Boolean(cRecipient?.id && cSubject.trim() && cBody.trim());
  const resetCompose = () => { setCRecipient(null); setCSubject(""); setCBody(""); };

  const handleCompose = async () => {
    if (!canCompose) return;
    setSending(true);
    try {
      if (!cRecipient) return;
      const convo = await createConversation(cRecipient.id);
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
      const initials = cRecipient.displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
      const newConvo: UIConversation = {
        id: convo.id,
        participantName: cRecipient.displayName,
        participantAvatar: cRecipient.avatarUrl || initials,
        participantId: cRecipient.id,
        participantUsername: cRecipient.username,
        participantRole: cRecipient.role,
        participantVerified: cRecipient.verified,
        participantSubscriber: cRecipient.subscriber,
        participantCredibilityScore: cRecipient.credibilityScore,
        requestStatus: convo.requestStatus,
        initiatedBy: user?.id,
        projectName: "",
        subject: cSubject.trim(),
        unread: false,
        thread: [{ id: sent.msgId || clientMsgId, fromMe: true, authorName: "You", body: cBody.trim(), timestamp: new Date().toISOString() }],
      };
      setConvos((cur) => [newConvo, ...cur]);
      setActiveId(newConvo.id);
      setComposeOpen(false);
      resetCompose();
      toast(convo.deliveryMode === "request" ? "Message request sent" : "Message sent");
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
          <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
          <p className="text-sm text-text-muted mt-0.5">{loading ? "Loading live conversations..." : `${convos.length} conversations · ${unreadCount} unread`}</p>
        </div>
        <div className="flex items-center gap-2"><Link to="/support" className="app-touch-target inline-flex items-center gap-2 rounded-lg border border-border-default px-3 text-sm font-medium text-text-secondary hover:bg-background-primary" aria-label="Open support tickets"><Ticket className="h-4 w-4" />Support</Link><button onClick={() => setComposeOpen(true)} className="h-9 px-4 bg-status-warning hover:bg-amber-400 text-text-primary rounded-lg text-sm font-semibold">Compose</button></div>
      </div>

      <div className="flex-1 px-6 lg:px-8 pb-6 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Inbox */}
          <div className="border border-border-default bg-surface-primary rounded-xl overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {loading && <li className="p-4 text-sm text-text-muted">Loading live conversations...</li>}
              {!loading && error && (
                <li className="p-4 text-sm text-status-error">Live conversations are unavailable: {error}</li>
              )}
              {!loading && !error && convos.length === 0 && (
                <li className="p-4 text-sm text-text-muted">No live conversations yet.</li>
              )}
              {convos.map((c) => (
                <li key={c.id}>
                  <button onClick={() => handleSelect(c.id)}
                    className={`w-full text-left p-4 hover:bg-background-primary transition-colors ${c.id === activeId ? "bg-status-warning-soft" : ""}`}>
                    <div className="flex items-start gap-3">
                      {/^(https?:)?\//.test(c.participantAvatar) ? <img src={c.participantAvatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-slate-200 text-text-secondary font-semibold flex items-center justify-center text-sm shrink-0">{c.participantAvatar}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {c.unread && <span className="w-2 h-2 rounded-full bg-status-warning shrink-0"></span>}
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary truncate">{c.participantName}<IdentityBadges verified={c.participantVerified} subscriber={c.participantSubscriber} credibilityScore={c.participantCredibilityScore} compact /></p>
                        </div>
                        <p className="text-xs text-text-muted truncate">{metaLine(c) || "Conversation"}</p>
                        <p className="text-xs text-text-disabled truncate mt-0.5">{c.thread[c.thread.length - 1]?.body}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversation pane */}
          <div className="md:col-span-2 border border-border-default bg-surface-primary rounded-xl flex flex-col overflow-hidden">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm text-text-muted">Select a conversation</div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-border-subtle">
                  <p className="flex items-center gap-1.5 font-semibold text-text-primary">{active.participantName}<IdentityBadges verified={active.participantVerified} subscriber={active.participantSubscriber} credibilityScore={active.participantCredibilityScore} /></p>
                  <p className="text-xs text-text-muted">{active.participantUsername ? `@${active.participantUsername} · ` : ''}{active.requestStatus === 'pending' ? 'Message request' : metaLine(active) || "Conversation"}</p>
                </div>
                {active.requestStatus === 'pending' && <div className="flex items-center justify-between gap-3 border-b border-status-warning bg-status-warning px-5 py-3 text-sm text-amber-950"><span>{active.initiatedBy === user?.id ? 'Waiting for this member to accept your message request.' : 'This member sent you a message request.'}</span>{active.initiatedBy !== user?.id && <span className="flex gap-2"><button type="button" onClick={() => void respondToRequest('declined')} className="rounded border border-status-warning px-3 py-1.5 text-xs font-medium">Decline</button><button type="button" onClick={() => void respondToRequest('active')} className="rounded bg-status-warning px-3 py-1.5 text-xs font-medium text-text-primary">Accept</button></span>}</div>}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {active.thread.map((m) => (
                    <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-3 py-2 rounded-lg text-sm ${m.fromMe ? "bg-status-warning text-text-primary" : "bg-surface-secondary text-text-primary"}`}>
                        <MentionText body={m.body} mentions={m.mentions} />
                        <p className={`text-[10px] mt-1 ${m.fromMe ? "text-text-primary/70" : "text-text-muted"}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border-subtle p-3 flex items-end gap-2">
                  <MentionTextarea value={draft} onChange={setDraft} placeholder="Reply…"
                    containerClassName="flex-1"
                    rows={2}
                    className="flex-1 resize-none border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-status-warning" />
                  <button onClick={handleAttach} className="h-9 w-9 text-text-muted hover:bg-surface-secondary rounded-lg flex items-center justify-center"><Paperclip className="w-4 h-4" /></button>
                  <button onClick={() => void handleSend()} disabled={!draft.trim() || sending || active.requestStatus !== 'active'}
                    className="h-9 px-4 bg-status-warning text-text-primary font-semibold rounded-lg hover:bg-amber-400 disabled:bg-slate-200 disabled:text-text-disabled flex items-center gap-1.5">
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
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">To</label>
              <RecipientSearch selected={cRecipient} onSelect={setCRecipient} accentClass="focus:border-status-warning" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Subject</label>
              <input value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="Quick question"
                className="w-full h-10 border border-border-strong rounded-lg px-3 text-sm focus:outline-none focus:border-status-warning" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Body</label>
              <MentionTextarea value={cBody} onChange={setCBody} rows={4}
                className="w-full resize-none border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-status-warning" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setComposeOpen(false)} className="px-4 py-2 text-sm rounded-lg text-text-secondary hover:bg-surface-secondary">Cancel</button>
            <button onClick={() => void handleCompose()} disabled={!canCompose || sending}
              className="px-4 py-2 text-sm rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400 disabled:bg-slate-200 disabled:text-text-disabled">{sending ? "Sending..." : "Send"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
