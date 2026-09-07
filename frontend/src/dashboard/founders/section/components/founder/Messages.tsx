import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, Send, Ticket } from "lucide-react";
import {
  createConversation,
  fetchConversations,
  fetchHistory,
  markConvRead,
  restSendDM,
} from "@/lib/messaging/conversations";
import { mapConvSummary, mapMessage } from "@/lib/messaging/map";
import type { UIConversation, UIMessage } from "@/lib/messaging/types";
import { useMessaging } from "@/contexts/MessagingProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [recipientId, setRecipientId] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const { store, socket } = useMessaging();

  useEffect(() => {
    const recipient = searchParams.get("recipient")?.trim();
    if (!recipient) return;
    setRecipientId(recipient);
    setComposeOpen(true);
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
  const canCompose = Boolean(recipientId.trim() && composeBody.trim());

  const resetCompose = () => {
    setRecipientId("");
    setComposeBody("");
  };

  const handleCompose = async () => {
    if (!canCompose) return;
    setSending(true);
    try {
      const recipient = recipientId.trim();
      const conversation = await createConversation(recipient);
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
        participantName: recipient,
        participantAvatar:
          recipient
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "?",
        projectName: "",
        subject: body,
        unread: false,
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Messages</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {loading
              ? "Loading live conversations..."
              : `${conversations.length} conversations · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/support"
            className="app-touch-target inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] backdrop-blur-md transition-colors"
            aria-label="Open support tickets"
          >
            <Ticket className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
            Support
          </Link>
          <button
            onClick={() => setComposeOpen(true)}
            className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            Compose
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 pb-6 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-y-auto">
            <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {loading && (
                <li className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading live conversations...</li>
              )}
              {!loading && error && (
                <li className="p-4 text-sm text-red-600 dark:text-red-400">
                  Live conversations are unavailable: {error}
                </li>
              )}
              {!loading && !error && conversations.length === 0 && (
                <li className="p-4 text-sm text-slate-500 dark:text-slate-400">No live conversations yet.</li>
              )}
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleSelect(conversation.id)}
                    className={`w-full text-left p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors ${
                      conversation.id === activeId
                        ? "bg-[#0066ff]/10 dark:bg-[#0066ff]/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0066ff]/10 dark:bg-[#0066ff]/25 text-[#0066ff] dark:text-[#58a6ff] font-bold flex items-center justify-center text-sm shrink-0 border border-[#0066ff]/20">
                        {conversation.participantAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {conversation.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#0066ff] dark:bg-[#58a6ff] shrink-0" />
                          )}
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {conversation.participantName}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          {conversationMeta(conversation) || "Conversation"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
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

          <div className="md:col-span-2 border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
                {loading ? "Loading conversation..." : "Select a conversation"}
              </div>
            ) : (
              <>
                <div className="px-5 py-3.5 border-b border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md">
                  <p className="font-bold text-slate-900 dark:text-white">{active.participantName}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {conversationMeta(active) || "Conversation"}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {active.thread.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No persisted messages in this conversation.</p>
                  )}
                  {active.thread.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          message.fromMe
                            ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-[0_2px_10px_rgba(0,102,255,0.2)] rounded-tr-none"
                            : "bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.04] dark:border-white/10 text-slate-900 dark:text-white rounded-tl-none"
                        }`}
                      >
                        <p>{message.body}</p>
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            message.fromMe ? "text-blue-100/80" : "text-slate-500 dark:text-slate-400"
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
                <div className="border-t border-black/[0.06] dark:border-white/10 p-3 bg-white/40 dark:bg-white/[0.02] flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Reply..."
                    rows={2}
                    className="flex-1 resize-none border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
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
                    className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] rounded-xl flex items-center justify-center transition-colors shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() || sending}
                    className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(0,102,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shrink-0"
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
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">New message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
              <input
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                placeholder="Recipient user ID"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-xl px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
              <textarea
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                rows={5}
                placeholder="Write your message here..."
                className="w-full resize-none border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setComposeOpen(false)}
              className="px-4 py-2 text-sm rounded-xl font-semibold border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCompose()}
              disabled={!canCompose || sending}
              className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
