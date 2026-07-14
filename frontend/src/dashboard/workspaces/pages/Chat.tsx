import { useEffect, useMemo, useState } from 'react';
import { MoreVertical, Paperclip, Search, Send, Smile } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchChannelHistory, fetchChannels, restSendChannel } from '@/lib/messaging/channels';
import { initials as messageInitials, mapMessage } from '@/lib/messaging/map';
import type { UIMessage, WireChannel } from '@/lib/messaging/types';
import { useMessaging } from '@/contexts/MessagingProvider';

function currentUserId(): string {
  try {
    const raw = localStorage.getItem('techit_user');
    if (raw) return (JSON.parse(raw) as { id?: string }).id ?? '';
  } catch {
    // Ignore malformed local auth state; messages will render with sender ids.
  }
  return '';
}

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
  const { store } = useMessaging();

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
        const me = currentUserId();
        setLiveMessages(rows.map((message) => mapMessage(message, me)));
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
  }, [selectedChannelId]);

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
      }]));
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message send failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full bg-white flex">
      <div className="w-[240px] border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2">CHANNELS</div>
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedChannelId === channel.id
                    ? 'bg-[#2196F3] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm font-medium"># {channel.name}</span>
              </button>
            ))}
            {!loadingChannels && filteredChannels.length === 0 && (
              <p className="px-2 py-3 text-xs text-gray-500">No live channels found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-[60px] border-b border-gray-200 px-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{selectedChannel ? `# ${selectedChannel.name}` : 'No channel selected'}</h2>
            <p className="text-xs text-gray-500">
              {selectedChannel ? `${liveMessages.length} persisted message${liveMessages.length === 1 ? '' : 's'}` : 'Connect messaging channels to start chatting'}
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Channel actions">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {loadingChannels || loadingMessages ? (
              <p className="text-sm text-gray-500">Loading live channel messages...</p>
            ) : liveMessages.length > 0 ? (
              liveMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className={`${msg.fromMe ? 'bg-[#2196F3]' : 'bg-slate-500'} text-white`}>
                      {messageInitials(msg.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold">{msg.authorName}</span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-gray-700">{msg.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No persisted messages in this channel yet.</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200 focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3]">
            <button className="p-2 hover:bg-gray-200 rounded transition-colors" aria-label="Attach file" disabled={!selectedChannel}>
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="text"
              value={draft}
              disabled={!selectedChannel || sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleChannelSend(); } }}
              placeholder={selectedChannel ? `Message #${selectedChannel.name.toLowerCase()}` : 'Select a channel'}
              className="flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
            />
            <button className="p-2 hover:bg-gray-200 rounded transition-colors" aria-label="Emoji" disabled={!selectedChannel}>
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => { void handleChannelSend(); }}
              disabled={!selectedChannel || sending || !draft.trim()}
              className="p-2 bg-[#2196F3] text-white rounded hover:bg-[#2196F3]/90 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
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
