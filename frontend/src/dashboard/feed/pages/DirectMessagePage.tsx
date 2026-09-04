import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import {
  fetchConversations,
  fetchHistory,
  createConversation,
  acceptMessageRequest,
  declineMessageRequest,
  restSendDM,
  markConvRead,
} from '@/lib/messaging/conversations';
import type { MessageIdentity, WireMessage, WireConvSummary } from '@/lib/messaging/types';
import { MentionTextarea } from '@/components/messaging/MentionTextarea';
import { MentionText } from '@/components/messaging/MentionText';
import { IdentityBadges } from '@/components/messaging/IdentityBadges';
import { useAuth } from '@/contexts/AuthContext';

export function DirectMessagePage() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WireMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherName, setOtherName] = useState<string>('');
  const [otherIdentity, setOtherIdentity] = useState<MessageIdentity | null>(null);
  const [requestStatus, setRequestStatus] = useState<'active' | 'pending' | 'declined'>('active');
  const [initiatedBy, setInitiatedBy] = useState('');
  const [requestMessageSent, setRequestMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Resolve or create conversation with the target user
  useEffect(() => {
    if (!userId) return;
    let alive = true;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        // Try to find existing conversation with this user
        const conversations: WireConvSummary[] = await fetchConversations();
        const existing = conversations.find((c) => c.otherUserId === userId);

        if (existing && existing.id) {
          if (!alive) return;
          setConversationId(existing.id);
          setOtherName(existing.otherName || userId || '');
          setOtherIdentity({ id: existing.otherUserId, displayName: existing.otherName, username: existing.otherUsername, avatarUrl: existing.otherAvatarUrl, role: existing.otherRole, verified: existing.otherVerified, subscriber: existing.otherSubscriber, credibilityScore: existing.otherCredibilityScore });
          setRequestStatus(existing.requestStatus || 'active');
          setInitiatedBy(existing.initiatedBy || '');

          // Load message history
          const history = await fetchHistory(existing.id);
          if (!alive) return;
          setMessages(history);

          // Mark as read
          if (existing.lastMsgId) {
            markConvRead(existing.id, existing.lastMsgId);
          }
        } else {
          // Create a new conversation
          const created = await createConversation(userId || '');
          if (!alive) return;
          if (created && created.id) {
            setConversationId(created.id);
            setOtherName(created.recipient?.displayName || userId || '');
            setOtherIdentity(created.recipient || null);
            setRequestStatus(created.requestStatus || 'active');
            setInitiatedBy(user?.id || '');
          } else {
            setError('Could not create conversation. The messaging service may be unavailable.');
          }
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        if (alive) setLoading(false);
      }
    }

    init();
    return () => { alive = false; };
  }, [user?.id, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;

    const body = input.trim();
    setInput('');
    setSending(true);

    const clientMsgId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Optimistic update
    const optimistic: WireMessage = {
      id: clientMsgId,
      convId: conversationId,
      senderId: 'me',
      type: 'text',
      body,
      ts: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await restSendDM(conversationId, clientMsgId, body);
      if (result) {
        // Replace optimistic message with confirmed one
        setMessages((prev) =>
          prev.map((m) => (m.id === clientMsgId ? { ...m, id: result.msgId, pending: result.pending } : m)),
        );
        if (result.pending) setError('Saved locally. Waiting for connection.');
        if (requestStatus === 'pending') setRequestMessageSent(true);
      }
    } catch (err) {
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientMsgId ? { ...m, body: `${m.body} (failed to send)` } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const respondToRequest = async (status: 'active' | 'declined') => {
    if (!conversationId) return;
    try { if (status === 'active') await acceptMessageRequest(conversationId); else await declineMessageRequest(conversationId); setRequestStatus(status); }
    catch (err) { setError(err instanceof Error ? err.message : 'Message request could not be updated.'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-primary">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <AlertCircle className="w-8 h-8 text-status-error" />
          <p className="text-text-primary font-medium">Could not load messages</p>
          <p className="text-text-muted text-sm max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-primary h-full">
      {/* Header */}
      <div className="border-b border-border-default px-6 py-4 bg-surface-primary">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-accent-primary">
              {(otherName || userId || '?')[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 text-text-primary font-semibold text-base">{otherName || userId}<IdentityBadges verified={otherIdentity?.verified} subscriber={otherIdentity?.subscriber} credibilityScore={otherIdentity?.credibilityScore} /></h2>
            <p className="text-text-muted text-xs">{otherIdentity?.username ? `@${otherIdentity.username} · ` : ''}{requestStatus === 'pending' ? 'Message request' : 'Direct message'}</p>
          </div>
        </div>
      </div>

      {requestStatus === 'pending' && <div className="flex items-center justify-between gap-3 border-b border-border-default bg-surface-secondary px-6 py-3 text-sm text-text-primary"><span>{initiatedBy === user?.id ? 'Waiting for this member to accept your request.' : 'Review this message request before replying.'}</span>{initiatedBy !== user?.id && <span className="flex gap-2"><button type="button" onClick={() => void respondToRequest('declined')} className="rounded border border-border-default px-3 py-1.5 text-xs">Decline</button><button type="button" onClick={() => void respondToRequest('active')} className="rounded bg-accent-primary px-3 py-1.5 text-xs text-white">Accept</button></span>}</div>}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-text-muted text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? 'bg-accent-primary text-white rounded-br-md'
                    : 'bg-surface-secondary text-text-primary rounded-bl-md'
                }`}
              >
                <MentionText body={msg.body} mentions={msg.mentions} className="text-sm whitespace-pre-wrap break-words" />
                <p
                  className={`text-[10px] mt-1 ${
                    isMe ? 'text-white/70' : 'text-text-muted'
                  }`}
                >
                  {formatTime(msg.ts)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border-default px-6 py-4 bg-surface-primary">
        <div className="flex items-center gap-3">
          <MentionTextarea
            value={input}
            onChange={setInput}
            containerClassName="flex-1"
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            className="w-full resize-none px-4 py-2.5 bg-surface-secondary border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !conversationId || sending || requestStatus === 'declined' || (requestStatus === 'pending' && (initiatedBy !== user?.id || requestMessageSent || messages.some(message => message.senderId === user?.id || message.senderId === 'me')))}
            className="p-2.5 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
