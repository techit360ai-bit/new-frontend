import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, Send, Ticket } from "lucide-react";
import {
  createConversation,
  acceptMessageRequest,
  declineMessageRequest,
  fetchConversations,
  fetchHistory,
  markConvRead,
  restSendDM,
  searchMessageRecipients,
} from "@/lib/messaging/conversations";
import { mapConvSummary, mapMessage } from "@/lib/messaging/map";
import type { MessageIdentity, UIConversation, UIMessage } from "@/lib/messaging/types";
import { useMessaging } from "@/contexts/MessagingProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RecipientSearch } from "@/components/messaging/RecipientSearch";
import { MentionTextarea } from "@/components/messaging/MentionTextarea";
import { MentionText } from "@/components/messaging/MentionText";
import { IdentityBadges } from "@/components/messaging/IdentityBadges";

function conversationMeta(conversation: Pick<UIConversation, "projectName" | "subject">): string {
  return [conversation.projectName, conversation.subject].filter(Boolean).join(" · ");
}

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState<MessageIdentity | null>(null);
  const [composeBody, setComposeBody] = useState("");

  const { store, socket } = useMessaging();

  useEffect(() => {
    const recipient = searchParams.get("recipient")?.trim();
    if (!recipient) return;
    setComposeOpen(true);
    void searchMessageRecipients(recipient).then((results) => {
      const match = results.find(item => item.id === recipient);
      if (match) setRecipient(match);
    }).catch(() => undefined);
  }, [searchParams]);

  const clearComposeRecipient = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("recipient");
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((list) => {
        if (!alive) return;
        const mapped = list.map(mapConvSummary);
        setConversations(mapped);
        setActiveId((current) => current || mapped[0]?.id || "");
      })
      .catch((err) => {
        if (!alive) return;
        setConversations([]);
        setActiveId("");
        setError(err instanceof Error ? err.message : "Live conversations are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    fetchHistory(activeId)
      .then((messages) => {
        if (!alive || messages.length === 0) return;
        const thread = messages
          .slice()
          .reverse()
          .map((message) => mapMessage(message, user?.id ?? ""));
        const lastMessageId = thread[thread.length - 1]?.id;
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeId
              ? { ...conversation, thread, lastMessageId }
              : conversation,
          ),
        );
      })
      .catch((err) => {
        if (alive) {
          toast.error(err instanceof Error ? err.message : "Could not load conversation history.");
        }
      });
    return () => {
      alive = false;
    };
  }, [activeId, user?.id]);

  useEffect(() => {
    if (!activeId) return;
    const liveMessages = store.threads[activeId];
    if (!liveMessages || liveMessages.length === 0) return;
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== activeId) return conversation;
        const seen = new Set(conversation.thread.map((message) => message.id));
        const additions = liveMessages.filter((message) => !seen.has(message.id));
        const thread = [...conversation.thread, ...additions];
        return {
          ...conversation,
          thread,
          subject: thread[thread.length - 1]?.body || conversation.subject,
          lastMessageId: thread[thread.length - 1]?.id || conversation.lastMessageId,
        };
      }),
    );
  }, [store, activeId]);

  const active = conversations.find((conversation) => conversation.id === activeId);
  const unreadCount = conversations.filter((conversation) => conversation.unread).length;

  const handleSelect = (id: string) => {
    const selected = conversations.find((conversation) => conversation.id === id);
    setActiveId(id);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: false } : conversation,
      ),
    );
    if (selected?.unread && selected.lastMessageId) {
      void markConvRead(id, selected.lastMessageId);
    }
  };

  const appendMessage = (conversationId: string, message: UIMessage) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              thread: [...conversation.thread, message],
              subject: message.body,
              lastMessageId: message.id,
            }
          : conversation,
      ),
    );
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    const clientMsgId = `cm-${Date.now()}`;
    const optimisticMessage: UIMessage = {
      id: clientMsgId,
      fromMe: true,
      authorName: "You",
      body,
      timestamp: new Date().toISOString(),
    };

    setSending(true);
    try {
      if (socket) {
        socket.send({
          type: "message.send",
          data: { convId: activeId, clientMsgId, type: "text", body },
        });
        appendMessage(activeId, optimisticMessage);
        setDraft("");
      } else {
        const sent = await restSendDM(activeId, clientMsgId, body);
        if (!sent) {
          toast.error("Message was not sent.");
          return;
        }
        appendMessage(activeId, { ...optimisticMessage, id: sent.msgId || clientMsgId });
        setDraft("");
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
    try {
      if (status === "active") await acceptMessageRequest(active.id);
      else await declineMessageRequest(active.id);
      setConversations(current => current.map(item => item.id === active.id ? { ...item, requestStatus: status } : item));
      toast(status === "active" ? "Message request accepted" : "Message request declined");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Request could not be updated."); }
  };
  const canCompose = Boolean(recipient?.id && composeBody.trim());

  const resetCompose = () => {
    setRecipient(null);
    setComposeBody("");
  };

  const handleCompose = async () => {
    if (!canCompose) return;
    setSending(true);
    try {
      if (!recipient) return;
      const conversation = await createConversation(recipient.id);
      if (!conversation?.id) {
        toast.error("Conversation was not created.");
        return;
      }

      const body = composeBody.trim();
      const clientMsgId = `cm-${Date.now()}`;
      const sent = await restSendDM(conversation.id, clientMsgId, body);
      if (!sent) {
        toast.error("Message was not sent.");
        return;
      }

      const newConversation: UIConversation = {
        id: conversation.id,
        participantName: recipient.displayName,
        participantAvatar:
          recipient.displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "?",
        projectName: "",
        subject: body,
        unread: false,
        participantId: recipient.id,
        participantUsername: recipient.username,
        participantRole: recipient.role,
        participantVerified: recipient.verified,
        participantSubscriber: recipient.subscriber,
        participantCredibilityScore: recipient.credibilityScore,
        requestStatus: conversation.requestStatus,
        initiatedBy: user?.id,
        lastMessageId: sent.msgId || clientMsgId,
        thread: [
          {
            id: sent.msgId || clientMsgId,
            fromMe: true,
            authorName: "You",
            body,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setConversations((current) => [
        newConversation,
        ...current.filter((item) => item.id !== newConversation.id),
      ]);
      setActiveId(newConversation.id);
      setComposeOpen(false);
      resetCompose();
      clearComposeRecipient();
      toast(conversation.deliveryMode === "request" ? "Message request sent" : "Message sent");
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
          <p className="text-sm text-text-muted mt-0.5">
            {loading
              ? "Loading live conversations..."
              : `${conversations.length} conversations · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2"><Link to="/support" className="app-touch-target inline-flex items-center gap-2 rounded-lg border border-border-default px-3 text-sm font-medium text-text-secondary hover:bg-background-primary" aria-label="Open support tickets"><Ticket className="h-4 w-4" />Support</Link><button onClick={() => setComposeOpen(true)} className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors">Compose</button></div>
      </div>

      <div className="flex-1 px-6 lg:px-8 pb-6 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border-default bg-surface-primary rounded-xl overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {loading && (
                <li className="p-4 text-sm text-text-muted">Loading live conversations...</li>
              )}
              {!loading && error && (
                <li className="p-4 text-sm text-status-error">
                  Live conversations are unavailable: {error}
                </li>
              )}
              {!loading && !error && conversations.length === 0 && (
                <li className="p-4 text-sm text-text-muted">No live conversations yet.</li>
              )}
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleSelect(conversation.id)}
                    className={`w-full text-left p-4 hover:bg-background-primary transition-colors ${
                      conversation.id === activeId ? "bg-violet-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/^(https?:)?\//.test(conversation.participantAvatar) ? <img src={conversation.participantAvatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center justify-center text-sm shrink-0">{conversation.participantAvatar}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {conversation.unread && (
                            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                          )}
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary truncate">{conversation.participantName}<IdentityBadges verified={conversation.participantVerified} subscriber={conversation.participantSubscriber} credibilityScore={conversation.participantCredibilityScore} compact /></p>
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          {conversationMeta(conversation) || "Conversation"}
                        </p>
                        <p className="text-xs text-text-disabled truncate mt-0.5">
                          {conversation.thread[conversation.thread.length - 1]?.body ||
                            conversation.subject}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 border border-border-default bg-surface-primary rounded-xl flex flex-col overflow-hidden">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
                {loading ? "Loading conversation..." : "Select a conversation"}
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-border-subtle">
                  <p className="flex items-center gap-1.5 font-semibold text-text-primary">{active.participantName}<IdentityBadges verified={active.participantVerified} subscriber={active.participantSubscriber} credibilityScore={active.participantCredibilityScore} /></p>
                  <p className="text-xs text-text-muted">
                    {active.participantUsername ? `@${active.participantUsername} · ` : ''}{active.requestStatus === 'pending' ? 'Message request' : conversationMeta(active) || "Conversation"}
                  </p>
                </div>
                {active.requestStatus === 'pending' && (
                  <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-violet-50 px-5 py-3 text-sm text-violet-900">
                    <span>{active.initiatedBy === user?.id ? 'Waiting for this member to accept your message request.' : 'This member sent you a message request.'}</span>
                    {active.initiatedBy !== user?.id && <span className="flex gap-2"><button type="button" onClick={() => void respondToRequest('declined')} className="rounded border border-violet-200 px-3 py-1.5 text-xs font-medium">Decline</button><button type="button" onClick={() => void respondToRequest('active')} className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">Accept</button></span>}
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {active.thread.length === 0 && (
                    <p className="text-sm text-text-muted">No persisted messages in this conversation.</p>
                  )}
                  {active.thread.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-3 py-2 rounded-lg text-sm ${
                          message.fromMe
                            ? "bg-violet-600 text-white"
                            : "bg-surface-secondary text-text-primary"
                        }`}
                      >
                        <MentionText body={message.body} mentions={message.mentions} />
                        <p
                          className={`text-[10px] mt-1 ${
                            message.fromMe ? "text-violet-200" : "text-text-muted"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border-subtle p-3 flex items-end gap-2">
                  <MentionTextarea
                    value={draft}
                    onChange={setDraft}
                    containerClassName="flex-1"
                    placeholder="Reply..."
                    rows={2}
                    className="flex-1 resize-none border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button
                    onClick={handleAttach}
                    aria-label="Attach file"
                    className="h-9 w-9 text-text-muted hover:bg-surface-secondary rounded-lg flex items-center justify-center"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() || sending || active.requestStatus !== 'active'}
                    className="h-9 px-4 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-500 disabled:bg-slate-200 disabled:text-text-disabled flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            resetCompose();
            clearComposeRecipient();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">To</label>
              <RecipientSearch selected={recipient} onSelect={setRecipient} accentClass="focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Message</label>
              <MentionTextarea
                value={composeBody}
                onChange={setComposeBody}
                rows={5}
                className="w-full resize-none border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setComposeOpen(false)}
              className="px-4 py-2 text-sm rounded-lg text-text-secondary hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCompose()}
              disabled={!canCompose || sending}
              className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:bg-slate-200 disabled:text-text-disabled transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
