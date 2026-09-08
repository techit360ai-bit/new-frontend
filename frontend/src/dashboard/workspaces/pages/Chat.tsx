import { useEffect, useMemo, useState } from 'react';
import { MoreVertical, Paperclip, Search, Send, Smile, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchChannelHistory, fetchChannels, markChannelRead, restSendChannel } from '@/lib/messaging/channels';
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
      }]));
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message send failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white transition-colors flex">
      <div className="w-[240px] border-r border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-[#0a1526] flex flex-col">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-black/[0.08] dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0066ff] outline-none transition-all"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">CHANNELS</div>
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl mb-1 transition-all ${
                  selectedChannelId === channel.id
                    ? 'bg-[#0066ff]/20 text-[#58a6ff] font-semibold border-l-2 border-[#0066ff]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium"># {channel.name}</span>
              </button>
            ))}
            {!loadingChannels && filteredChannels.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-400">No live channels found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-[#121212]">
        <div className="h-[60px] border-b border-black/[0.06] dark:border-white/10 px-6 flex items-center justify-between bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{selectedChannel ? `# ${selectedChannel.name}` : 'No channel selected'}</h2>
            <p className="text-xs text-slate-400">
              {selectedChannel ? `${liveMessages.length} persisted message${liveMessages.length === 1 ? '' : 's'}` : 'Connect messaging channels to start chatting'}
            </p>
          </div>
          <div className="flex items-center gap-2"><Link to="/support" className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors" aria-label="Open support tickets"><Ticket className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />Support</Link><button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400" aria-label="Channel actions"><MoreVertical className="w-5 h-5" /></button></div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {loadingChannels || loadingMessages ? (
              <p className="text-sm text-slate-400">Loading live channel messages...</p>
            ) : liveMessages.length > 0 ? (
              liveMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0 border border-white dark:border-[#121212]">
                    <AvatarFallback className={`${msg.fromMe ? 'bg-gradient-to-r from-[#0066ff] to-[#58a6ff]' : 'bg-slate-600'} text-white font-bold`}>
                      {messageInitials(msg.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{msg.authorName}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{msg.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No persisted messages in this channel yet.</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl p-2 border border-black/[0.08] dark:border-white/10 focus-within:border-[#0066ff] focus-within:ring-2 focus-within:ring-[#0066ff]/20 transition-all">
            <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400" aria-label="Attach file" disabled={!selectedChannel}>
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={draft}
              disabled={!selectedChannel || sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleChannelSend(); } }}
              placeholder={selectedChannel ? `Message #${selectedChannel.name.toLowerCase()}` : 'Select a channel'}
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none disabled:cursor-not-allowed"
            />
            <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400" aria-label="Emoji" disabled={!selectedChannel}>
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => { void handleChannelSend(); }}
              disabled={!selectedChannel || sending || !draft.trim()}
              className="p-2.5 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
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
