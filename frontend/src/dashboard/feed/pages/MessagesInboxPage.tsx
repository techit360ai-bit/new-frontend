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

export function conversationPath(conversation: Pick<UIConversation, 'participantId'>): string | null {
  return conversation.participantId ? `/feed/messages/${encodeURIComponent(conversation.participantId)}` : null;
}
export function conversationState(
  conversation: Pick<UIConversation, 'requestStatus' | 'initiatedBy' | 'unread'>,
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
    if (!recipient?.id || !recipient.canMessage) return;
    navigate(`/feed/messages/${encodeURIComponent(recipient.id)}`);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-20 sm:px-6 lg:pb-8">
      <header className="flex flex-col gap-4 border-b border-border-default pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent-primary" />
            <h1 className="text-xl font-semibold text-text-primary">Messages</h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {loading ? 'Loading conversations...' : `${conversations.length} conversations · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/support" className="inline-flex h-9 items-center gap-2 rounded-md border border-border-default px-3 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary">
            <Ticket className="h-4 w-4" /> Support
          </Link>
          <button type="button" onClick={load} className="flex h-9 w-9 items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-secondary hover:text-text-primary" aria-label="Refresh conversations" title="Refresh conversations">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <section className="py-5">
        <label className="mb-2 block text-sm font-medium text-text-primary">Start a conversation</label>
        <RecipientSearch selected={null} onSelect={openRecipient} />
        <p className="mt-2 text-xs text-text-muted">
          Search by name or username. Connection, shared-context, verification, and subscription rules still apply.
        </p>
      </section>

      <section aria-label="Conversation inbox">
        {loading && <PageLoadingState label="Loading messages" />}
        {!loading && error && (
          <PageErrorState
            title="Messages unavailable"
            description={error}
            action={<button type="button" onClick={load} className="rounded-md bg-accent-primary px-3 py-2 text-sm font-medium text-white">Try again</button>}
          />
        )}
        {!loading && !error && conversations.length === 0 && (
          <PageEmptyState title="No conversations yet" description="Search for a TechIT member above to start an eligible conversation or message request." />
        )}
        {!loading && !error && conversations.length > 0 && (
          <ul className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default bg-surface-primary">
            {conversations.map((conversation) => {
              const path = conversationPath(conversation);
              const state = conversationState(conversation, user?.id);
              const time = relativeTime(conversation.lastActivityAt);
              const content = (
                <>
                  {/^(https?:)?\//.test(conversation.participantAvatar) ? (
                    <img src={conversation.participantAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">{conversation.participantAvatar}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-text-primary">{conversation.participantName}</span>
                      <IdentityBadges verified={conversation.participantVerified} subscriber={conversation.participantSubscriber} credibilityScore={conversation.participantCredibilityScore} compact />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-text-secondary">{conversation.subject || 'No messages yet'}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span className={conversation.unread || state === 'Message request' ? 'font-medium text-accent-primary' : ''}>{state}</span>
                      {conversation.participantUsername && <span>@{conversation.participantUsername}</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">{time}</span>
                </>
              );

              return (
                <li key={conversation.id}>
                  {path ? (
                    <Link to={path} className="flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary">{content}</Link>
                  ) : (
                    <div className="flex min-h-20 items-center gap-3 px-4 py-3 opacity-60">{content}</div>
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
