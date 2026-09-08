import { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Users,
  MoreVertical,
  X,
  Minimize2,
  MessageSquare,
  Hand,
  Smile,
  Send,
  Radio,
  Grid,
  Maximize2,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Participant {
  name: string;
  avatar: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  role?: string;
}

interface VideoCallProps {
  onClose: () => void;
  participants?: Participant[];
  self?: { name: string; avatar: string };
  isPIP?: boolean;
  onTogglePIP?: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export function VideoCall({ onClose, participants, self, isPIP = false, onTogglePIP }: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'participants' | 'chat'>('none');
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight'>('grid');
  const [showReactions, setShowReactions] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  const defaultParticipants: Participant[] = [
    { name: 'Sarah Chen', avatar: 'SC', isMuted: false, isVideoOff: false, isSpeaking: true, role: 'Lead Architect' },
    { name: 'Alex Rivera', avatar: 'AR', isMuted: true, isVideoOff: false, role: 'Frontend Eng' },
    { name: 'David Kim', avatar: 'DK', isMuted: false, isVideoOff: true, role: 'AI Specialist' },
  ];

  const liveParticipants = participants && participants.length > 0 ? participants : defaultParticipants;
  const currentUser = self ?? { name: 'You (Host)', avatar: 'YOU' };

  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([
    { id: '1', sender: 'Sarah Chen', text: 'Hey team! Reviewing the AI agent architecture code now.', time: '10:42 AM' },
    { id: '2', sender: 'Alex Rivera', text: 'Screen share looks crisp! I can see the connectors.', time: '10:43 AM' },
  ]);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser.name,
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatLogs((prev) => [...prev, newMsg]);
    setChatMessage('');
  };

  const triggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setActiveReaction(null), 3000);
  };

  // Picture-in-Picture View
  if (isPIP) {
    return (
      <div className="fixed bottom-6 right-6 w-84 bg-[#121212]/95 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden border border-[#0066ff]/40 z-50 transition-all">
        <div className="relative">
          <div className="aspect-video bg-[#0a0e17] flex items-center justify-center relative overflow-hidden">
            {isVideoOff ? (
              <Avatar className="w-16 h-16 ring-2 ring-[#0066ff]/40">
                <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-xl font-bold">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0066ff]/20 via-[#121212] to-[#58a6ff]/20 flex items-center justify-center">
                <Avatar className="w-16 h-16 ring-4 ring-[#0066ff]/30 animate-pulse">
                  <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-xl font-bold">
                    {currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#20c937] animate-ping" />
              <span className="text-white text-xs font-semibold">{formatTime(callDuration)}</span>
            </div>
          </div>

          <div className="absolute top-2 right-2 flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="w-7 h-7 p-0 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10"
              onClick={onTogglePIP}
              title="Expand Call"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-7 h-7 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md"
              onClick={onClose}
              title="Leave Call"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-3 bg-[#121212] flex items-center justify-between border-t border-white/10">
            <div className="flex gap-2">
              <Button
                size="sm"
                className={`w-9 h-9 p-0 rounded-xl ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                className={`w-9 h-9 p-0 rounded-xl ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
            </div>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">{currentUser.name}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen / Modal Call Layout
  return (
    <div className="fixed inset-0 bg-[#0a0d14] text-white z-50 flex flex-col font-sans overflow-hidden">
      {/* Active Floating Reaction Popup */}
      {activeReaction && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 text-4xl animate-bounce shadow-2xl">
          {activeReaction}
        </div>
      )}

      {/* Call Header */}
      <div className="h-16 border-b border-white/10 bg-[#121212]/90 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0066ff]/15 rounded-xl border border-[#0066ff]/30 text-[#58a6ff]">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base leading-none">Workspace Live Sync</h2>
              <Badge className="bg-[#20c937]/20 text-[#20c937] border border-[#20c937]/30 text-[10px] px-2 py-0.5 font-bold">
                <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" /> HD Encrypted
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{liveParticipants.length + 1} Participants</span>
              <span>•</span>
              <span className="text-[#58a6ff] font-medium">{formatTime(callDuration)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'spotlight' : 'grid')}
            className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl"
            title="Toggle View Layout"
          >
            <Grid className="w-4 h-4 mr-2" />
            {viewMode === 'grid' ? 'Spotlight View' : 'Grid View'}
          </Button>

          {onTogglePIP && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={onTogglePIP}
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Minimize
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl p-2"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Stage Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-center">
          {/* Screen Sharing Banner if active */}
          {isScreenSharing && (
            <div className="mb-4 bg-gradient-to-r from-[#0066ff]/20 to-[#58a6ff]/10 border border-[#0066ff]/30 p-3 rounded-2xl flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#58a6ff]">
                <MonitorUp className="w-4 h-4 animate-bounce" />
                You are presenting your screen to the team workspace
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs rounded-lg px-3 bg-red-500/80 hover:bg-red-600"
                onClick={() => setIsScreenSharing(false)}
              >
                Stop Presenting
              </Button>
            </div>
          )}

          {/* Grid Layout */}
          <div
            className={`grid gap-4 w-full h-full max-h-[calc(100vh-170px)] ${
              viewMode === 'grid'
                ? liveParticipants.length >= 3
                  ? 'grid-cols-2 grid-rows-2'
                  : 'grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Live Participants Cards */}
            {liveParticipants.map((participant) => (
              <div
                key={participant.name}
                className={`bg-[#121212]/80 backdrop-blur-xl rounded-2xl relative overflow-hidden flex items-center justify-center border transition-all duration-300 group ${
                  participant.isSpeaking
                    ? 'border-[#0066ff] shadow-[0_0_25px_rgba(0,102,255,0.3)] ring-2 ring-[#0066ff]/50'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {participant.isVideoOff ? (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-24 h-24 ring-4 ring-white/10">
                      <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white text-3xl font-bold">
                        {participant.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-400 font-medium">Camera Off</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0a1526] via-[#121212] to-[#1a2942] flex flex-col items-center justify-center relative">
                    <Avatar className={`w-24 h-24 transition-all duration-300 ${participant.isSpeaking ? 'scale-110 ring-4 ring-[#0066ff]' : 'ring-2 ring-white/10'}`}>
                      <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-3xl font-bold">
                        {participant.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <div className="mt-3 flex items-center gap-1 bg-[#0066ff]/20 px-3 py-1 rounded-full border border-[#0066ff]/40">
                        <span className="w-2 h-2 bg-[#20c937] rounded-full animate-ping" />
                        <span className="text-[11px] font-bold text-[#58a6ff]">Speaking</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Participant Overlay Details */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
                    <span className="text-white text-xs font-semibold">{participant.name}</span>
                    {participant.role && (
                      <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">
                        {participant.role}
                      </span>
                    )}
                    {participant.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400 ml-1" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Current User Card */}
            <div
              className={`bg-[#121212]/80 backdrop-blur-xl rounded-2xl relative overflow-hidden flex items-center justify-center border transition-all duration-300 ${
                !isMuted ? 'border-[#0066ff]/40 shadow-[0_0_20px_rgba(0,102,255,0.15)]' : 'border-white/10'
              }`}
            >
              {isVideoOff ? (
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24 ring-4 ring-[#0066ff]/30">
                    <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-3xl font-bold">
                      {currentUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-400 font-medium">Your Camera is Off</span>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0d1b2a] via-[#121212] to-[#0066ff]/20 flex flex-col items-center justify-center">
                  <Avatar className="w-24 h-24 ring-4 ring-[#0066ff]/40">
                    <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-3xl font-bold">
                      {currentUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
                  <span className="text-white text-xs font-semibold">{currentUser.name}</span>
                  {isHandRaised && (
                    <Badge className="bg-[#0066ff] text-white text-[10px] px-1.5 py-0.5">
                      <Hand className="w-2.5 h-2.5 mr-1" /> Hand Raised
                    </Badge>
                  )}
                  {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Participants or In-Call Chat) */}
        {activeSidePanel !== 'none' && (
          <div className="w-80 bg-[#121212] border-l border-white/10 flex flex-col z-20 transition-all">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {activeSidePanel === 'participants' ? (
                  <>
                    <Users className="w-4 h-4 text-[#58a6ff]" /> Participants ({liveParticipants.length + 1})
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-[#58a6ff]" /> In-Call Chat
                  </>
                )}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 p-0 rounded-lg text-slate-400 hover:text-white"
                onClick={() => setActiveSidePanel('none')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {activeSidePanel === 'participants' ? (
                <>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Host & You</div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#0066ff] text-white text-xs font-bold">
                          {currentUser.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                        <div className="text-[10px] text-[#58a6ff]">Host</div>
                      </div>
                    </div>
                    {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#20c937]" />}
                  </div>

                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2">Members</div>
                  {liveParticipants.map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-700 text-white text-xs font-bold">
                            {p.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-semibold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.role ?? 'Member'}</div>
                        </div>
                      </div>
                      {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#20c937]" />}
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {chatLogs.map((msg) => (
                      <div key={msg.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#58a6ff]">{msg.sender}</span>
                          <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0066ff]"
                    />
                    <Button type="submit" size="sm" className="bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-xl px-3">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar Footer */}
      <div className="h-20 border-t border-white/10 bg-[#121212]/95 backdrop-blur-xl flex items-center justify-between px-8 z-20 shrink-0">
        <div className="flex items-center gap-2 max-md:hidden">
          <Badge className="bg-[#0066ff]/20 text-[#58a6ff] border border-[#0066ff]/30 text-xs px-3 py-1 font-semibold">
            <Shield className="w-3 h-3 mr-1.5 text-[#20c937]" /> Workspace Call Protected
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative">
          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setIsVideoOff(!isVideoOff)}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              isScreenSharing ? 'bg-[#0066ff] hover:bg-[#0052cc] text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            title="Share Screen"
          >
            <MonitorUp className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              isHandRaised ? 'bg-[#0066ff] text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setIsHandRaised(!isHandRaised)}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </Button>

          {/* Reaction Button & Menu */}
          <div className="relative">
            <Button
              size="lg"
              className="rounded-2xl w-12 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10"
              onClick={() => setShowReactions(!showReactions)}
              title="Reactions"
            >
              <Smile className="w-5 h-5" />
            </Button>

            {showReactions && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/15 p-2 rounded-2xl shadow-2xl flex gap-2 backdrop-blur-xl">
                {['👍', '👏', '🔥', '❤️', '🎉', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="hover:scale-125 transition-transform p-1.5 text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              activeSidePanel === 'participants' ? 'bg-[#0066ff] text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? 'none' : 'participants')}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            className={`rounded-2xl w-12 h-12 transition-all ${
              activeSidePanel === 'chat' ? 'bg-[#0066ff] text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')}
            title="In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            className="rounded-2xl px-6 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-[0_4px_15px_rgba(239,68,68,0.4)] flex items-center gap-2 ml-2"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
            End Call
          </Button>
        </div>

        <div className="flex items-center gap-2 max-md:hidden">
          <Badge className="bg-white/10 text-slate-300 border border-white/10 text-xs px-2.5 py-1">
            <Sparkles className="w-3 h-3 mr-1 text-[#58a6ff]" /> AI Active
          </Badge>
        </div>
      </div>
    </div>
  );
}

