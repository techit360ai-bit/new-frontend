import { useEffect, useMemo, useState } from 'react';
import { Hash, MoreVertical, Paperclip, Search, Send, ShieldCheck, Smile, Ticket, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
    <div className="h-full bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors flex overflow-hidden min-h-[calc(100vh-60px)]">
      {/* Left Glassmorphic Channels Sidebar */}
      <div className="w-[260px] border-r border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-[#111111]/80 backdrop-blur-xl flex flex-col shrink-0">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#20C997] outline-none transition-all"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-3 custom-scrollbar">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">
              <span>Team Channels</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">{filteredChannels.length}</span>
            </div>
            
            {filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#20C997]/15 via-[#20C997]/10 to-transparent text-[#20C997] font-semibold border-l-4 border-[#20C997] shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#20C997]' : 'text-slate-400'}`} />
                  <span className="text-xs truncate flex-1 text-left">{channel.name}</span>
                </button>
              );
            })}
            
            {!loadingChannels && filteredChannels.length === 0 && (
              <p className="px-2 py-4 text-xs text-slate-400">No live channels found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Conversation Stage */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a] min-w-0">
        {/* Chat Stage Header */}
        <div className="h-[60px] border-b border-black/[0.06] dark:border-white/10 px-6 flex items-center justify-between bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#20C997]/10 text-[#20C997] rounded-xl border border-[#20C997]/20">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-base leading-none">
                  {selectedChannel ? `${selectedChannel.name}` : 'Select Channel'}
                </h2>
                <Badge className="bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" /> Live Sync
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {selectedChannel ? `${liveMessages.length} persisted message${liveMessages.length === 1 ? '' : 's'}` : 'Connect messaging channels to start chatting'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/support"
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
              aria-label="Open support tickets"
            >
              <Ticket className="h-3.5 w-3.5 text-[#20C997]" />
              <span>Support Center</span>
            </Link>
            <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 transition-colors" aria-label="Channel actions">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Messages Stream */}
        <ScrollArea className="flex-1 p-6 custom-scrollbar">
          <div className="space-y-4 max-w-4xl mx-auto">
            {loadingChannels || loadingMessages ? (
              <div className="flex items-center justify-center p-12 text-xs font-medium text-slate-400">
                Loading live channel messages...
              </div>
            ) : liveMessages.length > 0 ? (
              liveMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 items-start ${msg.fromMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-9 h-9 shrink-0 ring-2 ring-[#20C997]/20">
                    <AvatarFallback className={`${msg.fromMe ? 'bg-[#20C997] text-slate-950 font-bold' : 'bg-slate-700 text-white'} text-xs font-bold`}>
                      {messageInitials(msg.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[75%] ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{msg.authorName}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
                        msg.fromMe
                          ? 'bg-[#20C997]/15 dark:bg-[#20C997]/20 text-slate-900 dark:text-white border border-[#20C997]/30 rounded-tr-none'
                          : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-black/[0.06] dark:border-white/10 rounded-tl-none'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Hash className="w-10 h-10 text-[#20C997] opacity-40 mb-2" />
                <p className="text-xs font-medium">No persisted messages in this channel yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Send a message below to kick off team communication.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input Footer */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl z-10 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-white/5 rounded-2xl p-2 border border-black/[0.08] dark:border-white/10 focus-within:border-[#20C997] focus-within:ring-2 focus-within:ring-[#20C997]/20 shadow-md transition-all">
            <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500 dark:text-slate-400" aria-label="Attach file" disabled={!selectedChannel}>
              <Paperclip className="w-4 h-4" />
            </button>
            
            <input
              type="text"
              value={draft}
              disabled={!selectedChannel || sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleChannelSend(); } }}
              placeholder={selectedChannel ? `Message #${selectedChannel.name.toLowerCase()}...` : 'Select a channel'}
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs outline-none disabled:cursor-not-allowed px-1"
            />
            
            <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500 dark:text-slate-400" aria-label="Emoji" disabled={!selectedChannel}>
              <Smile className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => { void handleChannelSend(); }}
              disabled={!selectedChannel || sending || !draft.trim()}
              className="p-2.5 bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
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

