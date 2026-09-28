import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, RefreshCw, Ticket } from 'lucide-react';
import { RecipientSearch } from '@/components/messaging/RecipientSearch';
import { IdentityBadges } from '@/components/messaging/IdentityBadges';
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/components/ui/page-state';
import { useAuth } from '@/contexts/AuthContext';
import { fetchConversations } from '@/lib/messaging/conversations';
import { mapConvSummary } from '@/lib/messaging/map';
import type { MessageIdentity, UIConversation } from '@/lib/messaging/types';
import { formatRelative } from '@/lib/formatRelative';

export function conversationPath(conversation: { participantId?: string }): string | null {
  return conversation.participantId ? `/feed/messages/${encodeURIComponent(conversation.participantId)}` : null;
}
export function conversationState(
  conversation: { requestStatus?: string; initiatedBy?: string; unread: boolean },
  currentUserId?: string,
): string {
  if (conversation.requestStatus === 'declined') return 'Request declined';
  if (conversation.requestStatus === 'pending') {
    return conversation.initiatedBy === currentUserId ? 'Request pending' : 'Message request';
  }
  return conversation.unread ? 'Unread' : 'Direct message';
}

function relativeTime(value?: string): string {
  return value && Number.isFinite(new Date(value).getTime()) ? formatRelative(value) : '';
}

export function MessagesInboxPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((rows) => setConversations(rows.map(mapConvSummary)))
      .catch((err) => {
        setConversations([]);
        setError(err instanceof Error ? err.message : 'Messages are unavailable.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = useMemo(
    () => conversations.filter((conversation) => conversation.unread).length,
    [conversations],
  );

  const openRecipient = (recipient: MessageIdentity | null) => {
    if (!recipient?.id) return;
    navigate(`/feed/messages/${encodeURIComponent(recipient.id)}`);
  };


  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 pb-20 sm:px-6 lg:pb-8">
      <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 ring-1 ring-emerald-500/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h1 className="font-bricolage text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Messages</h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            {loading ? 'Loading conversations...' : `${conversations.length} conversations · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/support" className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-slate-100 transition-all shadow-md">
            <Ticket className="h-4 w-4" /> Support
          </Link>
          <button type="button" onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-slate-100 transition-all shadow-md" aria-label="Refresh conversations" title="Refresh conversations">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <section className="py-6">
        <label className="mb-2 block font-bricolage text-sm font-semibold text-slate-200">Start a conversation</label>
        <RecipientSearch selected={null} onSelect={openRecipient} />
        <p className="mt-2.5 text-xs text-slate-400">
          Search by name or username. Connection, shared-context, verification, and subscription rules apply.
        </p>
      </section>

      <section aria-label="Conversation inbox">
        {loading && <PageLoadingState label="Loading messages" />}
        {!loading && error && (
          <PageErrorState
            title="Messages unavailable"
            description={error}
            action={<button type="button" onClick={load} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">Try again</button>}
          />
        )}
        {!loading && !error && conversations.length === 0 && (
          <PageEmptyState title="No conversations yet" description="Search for a TechIT member above to start an eligible conversation or message request." />
        )}
        {!loading && !error && conversations.length > 0 && (
          <ul className="divide-y divide-slate-800/80 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            {conversations.map((conversation) => {
              const path = conversationPath(conversation);
              const state = conversationState(conversation, user?.id);
              const time = relativeTime(conversation.lastActivityAt);
              const content = (
                <>
                  {/^(https?:)?\//.test(conversation.participantAvatar) ? (
                    <img src={conversation.participantAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-500/20" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20">{conversation.participantAvatar}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">{conversation.participantName}</span>
                      <IdentityBadges verified={conversation.participantVerified} subscriber={conversation.participantSubscriber} credibilityScore={conversation.participantCredibilityScore} compact />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-slate-300">{conversation.subject || 'No messages yet'}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className={conversation.unread || state === 'Message request' ? 'font-semibold text-emerald-400' : ''}>{state}</span>
                      {conversation.participantUsername && <span>@{conversation.participantUsername}</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{time}</span>
                </>
              );

              return (
                <li key={conversation.id}>
                  {path ? (
                    <Link to={path} className="flex min-h-20 items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500">{content}</Link>
                  ) : (
                    <div className="flex min-h-20 items-center gap-4 px-5 py-4 opacity-60">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
