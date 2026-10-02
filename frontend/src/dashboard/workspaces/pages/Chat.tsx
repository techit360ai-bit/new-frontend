import { useEffect, useMemo, useState } from 'react';
import { Search, Send, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteChannelMessage, editChannelMessage, fetchChannelHistory, fetchChannels, markChannelRead, restSendChannel } from '@/lib/messaging/channels';
import { initials as messageInitials, mapMessage } from '@/lib/messaging/map';
import type { UIMessage, WireChannel } from '@/lib/messaging/types';
import { useMessaging } from '@/contexts/MessagingProvider';
import { useAuth } from '@/contexts/AuthContext';

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mergeMessages(current: UIMessage[], incoming: UIMessage[]): UIMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => {
    const left = new Date(a.timestamp).getTime();
    const right = new Date(b.timestamp).getTime();
    return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right) || a.id.localeCompare(b.id);
  });
}

export function Chat() {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState<WireChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<UIMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const { store } = useMessaging();
  const { user } = useAuth();

  useEffect(() => {
    let alive = true;
    setLoadingChannels(true);
    setError(null);
    fetchChannels()
      .then((rows) => {
        if (!alive) return;
        setChannels(rows);
        setSelectedChannelId((current) => {
          if (current && rows.some((channel) => channel.id === current)) return current;
          return rows[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (!alive) return;
        setChannels([]);
        setSelectedChannelId(null);
        setError(err instanceof Error ? err.message : 'Live channels are unavailable.');
      })
      .finally(() => {
        if (alive) setLoadingChannels(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selectedChannelId) {
      setLiveMessages([]);
      return;
    }
    let alive = true;
    setLoadingMessages(true);
    setError(null);
    fetchChannelHistory(selectedChannelId)
      .then((rows) => {
        if (!alive) return;
        setLiveMessages(rows.map((message) => mapMessage(message, user?.id ?? '')));
        const latestMessageId = rows[0]?.id;
        if (latestMessageId) {
          void markChannelRead(selectedChannelId, latestMessageId).catch((err) => {
            if (alive) setError(err instanceof Error ? err.message : 'Could not persist channel read state.');
          });
        }
      })
      .catch((err) => {
        if (!alive) return;
        setLiveMessages([]);
        setError(err instanceof Error ? err.message : 'Live channel history is unavailable.');
      })
      .finally(() => {
        if (alive) setLoadingMessages(false);
      });
    return () => { alive = false; };
  }, [selectedChannelId, user?.id]);

  useEffect(() => {
    if (!selectedChannelId) return;
    const socketMessages = store.channelThreads[selectedChannelId];
    if (!socketMessages || socketMessages.length === 0) return;
    setLiveMessages((current) => mergeMessages(current, socketMessages));
  }, [store, selectedChannelId]);

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const filteredChannels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return channels;
    return channels.filter((channel) => channel.name.toLowerCase().includes(needle));
  }, [channels, query]);

  const handleChannelSend = async () => {
    if (!draft.trim() || !selectedChannelId || sending) return;
    setSending(true);
    setError(null);
    const body = draft.trim();
    const clientMsgId = `cm-${Date.now()}`;
    try {
      const result = await restSendChannel(selectedChannelId, clientMsgId, body);
      if (!result) throw new Error('Message was not accepted by the messaging service.');
      const timestamp = new Date().toISOString();
      setLiveMessages((current) => mergeMessages(current, [{
        id: result.msgId,
        fromMe: true,
        authorName: 'You',
        body,
        timestamp,
        pending: result.pending,
      }]));
      if (result.pending) setError('Saved locally. Waiting for connection.');
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message send failed.');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (message: UIMessage) => { if (!selectedChannelId || !editDraft.trim()) return; try { const updated = await editChannelMessage(selectedChannelId, message.id, editDraft.trim(), message.editVersion || 0); setLiveMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: updated.body, editedAt: updated.editedAt, editVersion: updated.editVersion } : item)); setEditingId(null); } catch (err) { setError(err instanceof Error ? err.message : 'Message could not be edited.'); } };
  const removeMessage = async (message: UIMessage) => { if (!selectedChannelId) return; try { const updated = await deleteChannelMessage(selectedChannelId, message.id, message.editVersion || 0); setLiveMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: 'This message was deleted', deletedAt: updated.deletedAt, editVersion: updated.editVersion } : item)); } catch (err) { setError(err instanceof Error ? err.message : 'Message could not be deleted.'); } };

  return (
    <div className="h-full bg-surface-primary flex">
      <div className="w-[240px] border-r border-border-default bg-background-primary">
        <div className="p-4 border-b border-border-default">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-border-default rounded-lg text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-2">
            <div className="text-xs font-semibold text-text-muted mb-2 px-2">CHANNELS</div>
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedChannelId === channel.id
                    ? 'bg-brand-primary text-white'
                    : 'text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <span className="text-sm font-medium"># {channel.name}</span>
              </button>
            ))}
            {!loadingChannels && filteredChannels.length === 0 && (
              <p className="px-2 py-3 text-xs text-text-muted">No live channels found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-[60px] border-b border-border-default px-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{selectedChannel ? `# ${selectedChannel.name}` : 'No channel selected'}</h2>
            <p className="text-xs text-text-muted">
              {selectedChannel ? `${liveMessages.length} persisted message${liveMessages.length === 1 ? '' : 's'}` : 'Connect messaging channels to start chatting'}
            </p>
          </div>
          <div className="flex items-center gap-2"><Link to="/support" className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm text-text-secondary hover:bg-background-primary" aria-label="Open support tickets"><Ticket className="h-4 w-4" />Support</Link></div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-status-error bg-status-error-soft px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {loadingChannels || loadingMessages ? (
              <p className="text-sm text-text-muted">Loading live channel messages...</p>
            ) : liveMessages.length > 0 ? (
              liveMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className={`${msg.fromMe ? 'bg-brand-primary' : 'bg-status-inactive'} text-white`}>
                      {messageInitials(msg.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold">{msg.authorName}</span>
                      <span className="text-xs text-text-muted">{formatTime(msg.timestamp)}</span>
                    </div>
                    {editingId === msg.id ? <div className="space-y-2"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} className="w-full rounded border border-border-default bg-surface-secondary p-2 text-sm" rows={2} /><div className="flex gap-2 text-xs"><button type="button" onClick={() => void saveEdit(msg)} className="text-brand-primary">Save</button><button type="button" onClick={() => setEditingId(null)} className="text-text-muted">Cancel</button></div></div> : <p className="text-text-secondary">{msg.body} {msg.editedAt && !msg.deletedAt ? <span className="text-xs text-text-muted">· Edited</span> : null}</p>}
                    {msg.fromMe && !msg.deletedAt && editingId !== msg.id && <div className="mt-1 flex gap-3 text-xs"><button type="button" onClick={() => { setEditingId(msg.id); setEditDraft(msg.body); }} className="text-text-muted hover:text-brand-primary">Edit</button><button type="button" onClick={() => void removeMessage(msg)} className="text-text-muted hover:text-status-error">Delete</button></div>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">No persisted messages in this channel yet.</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border-default">
          <div className="flex items-center gap-2 bg-background-primary rounded-lg p-2 border border-border-default focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-[#2196F3]">
            <input
              type="text"
              value={draft}
              disabled={!selectedChannel || sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleChannelSend(); } }}
              placeholder={selectedChannel ? `Message #${selectedChannel.name.toLowerCase()}` : 'Select a channel'}
              className="flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => { void handleChannelSend(); }}
              disabled={!selectedChannel || sending || !draft.trim()}
              className="p-2 bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
