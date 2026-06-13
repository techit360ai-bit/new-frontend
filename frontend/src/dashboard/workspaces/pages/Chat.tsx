import { useEffect, useState } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceWaveform } from '@/components/ui/voice-waveform';
import { fetchChannelHistory, restSendChannel } from '@/lib/messaging/channels';
import { useMessaging } from '@/contexts/MessagingProvider';

interface Message {
  id: number;
  user: string;
  avatar: string;
  color: string;
  message: string | null;
  time: string;
  voiceNote?: boolean;
}

const channels = [
  { id: 1, name: 'General', unread: 0 },
  { id: 2, name: 'Development', unread: 3 },
  { id: 3, name: 'Design', unread: 0 },
  { id: 4, name: 'Marketing', unread: 0 },
];

const messages: Message[] = [
  {
    id: 1,
    user: 'Sarah Chen',
    avatar: 'SC',
    color: 'bg-blue-500',
    message: "Hey team! Just pushed the latest updates to the repository.",
    time: '10:30 AM',
  },
  {
    id: 2,
    user: 'Mike Johnson',
    avatar: 'MJ',
    color: 'bg-green-500',
    message: "Great work! I'll review the PR this afternoon.",
    time: '10:32 AM',
  },
  {
    id: 3,
    user: 'Alex Kim',
    avatar: 'AK',
    color: 'bg-purple-500',
    message: "The new dashboard design looks amazing! 🚀",
    time: '10:35 AM',
  },
  {
    id: 4,
    user: 'Emma Wilson',
    avatar: 'EW',
    color: 'bg-pink-500',
    message: null,
    time: '10:38 AM',
    voiceNote: true,
  },
];

export function Chat() {
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(channels[1]);

  // TODO: load real channels from /channels for real UUIDs; mock IDs fall back offline-safe.
  const { store, socket } = useMessaging();
  const [liveMessages, setLiveMessages] = useState<Message[]>(messages);
  useEffect(() => {
    const chId = String(selectedChannel.id);
    let alive = true;
    fetchChannelHistory(chId).then((ms) => {
      if (!alive || ms.length === 0) return;
      setLiveMessages(ms.slice().reverse().map((m, i) => ({
        id: i + 1, user: m.senderId, avatar: m.senderId.slice(0, 2).toUpperCase(),
        color: 'bg-slate-500', message: m.body, time: new Date(m.ts).toLocaleTimeString(),
      })));
    });
    return () => { alive = false; };
  }, [selectedChannel]);
  // live channel messages from the socket store
  useEffect(() => {
    const chId = String(selectedChannel.id);
    const live = store.channelThreads[chId];
    if (!live || live.length === 0) return;
    setLiveMessages((cur) => [
      ...cur,
      ...live.map((m, i) => ({ id: cur.length + i + 1, user: m.authorName, avatar: m.authorName.slice(0, 2).toUpperCase(), color: 'bg-slate-500', message: m.body, time: new Date(m.timestamp).toLocaleTimeString() })),
    ]);
  }, [store, selectedChannel]);

  const handleChannelSend = () => {
    if (!message.trim()) return;
    const clientMsgId = `cm-${Date.now()}`;
    const chId = String(selectedChannel.id);
    if (socket) {
      socket.send({ type: 'message.send', data: { channelId: chId, clientMsgId, type: 'text', body: message.trim() } });
    } else {
      void restSendChannel(chId, clientMsgId, message.trim());
    }
    setMessage('');
  };

  return (
    <div className="h-full bg-white flex">
      {/* Channel List */}
      <div className="w-[240px] border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2">CHANNELS</div>
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedChannel.id === channel.id
                    ? 'bg-[#2196F3] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm font-medium"># {channel.name}</span>
                {channel.unread > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedChannel.id === channel.id ? 'bg-white text-[#2196F3]' : 'bg-[#F59E0B] text-white'
                  }`}>
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-[60px] border-b border-gray-200 px-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold"># {selectedChannel.name}</h2>
            <p className="text-xs text-gray-500">4 members online</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {liveMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className={`${msg.color} text-white`}>
                    {msg.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold">{msg.user}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  {msg.message ? (
                    <p className="text-gray-700">{msg.message}</p>
                  ) : (
                    <VoiceWaveform />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200 focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3]">
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChannelSend(); } }}
              placeholder={`Message #${selectedChannel.name.toLowerCase()}`}
              className="flex-1 bg-transparent outline-none"
            />
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleChannelSend} className="p-2 bg-[#2196F3] text-white rounded hover:bg-[#2196F3]/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}