import { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AudioCallProps {
  onClose: () => void;
  participant?: { name: string; avatar: string; role?: string };
  self?: { name: string; avatar: string };
}

export function AudioCall({ onClose, participant, self }: AudioCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const activeParticipant = participant ?? self ?? { name: 'Workspace Audio Hub', avatar: 'AH', role: 'Team Room' };

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

  return (
    <div className="fixed inset-0 bg-[#0a0d14]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[#121212]/95 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/10 relative overflow-hidden">
          {/* Top Decorative Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#0066ff]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Status Header */}
          <div className="flex items-center justify-between mb-8 z-10 relative">
            <Badge className="bg-[#20c937]/15 text-[#20c937] border border-[#20c937]/30 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" /> HD Audio 48kHz
            </Badge>
            <Badge className="bg-white/10 text-slate-300 border border-white/10 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#58a6ff]" /> Encrypted
            </Badge>
          </div>

          {/* Participant Avatar & Pulse Ring */}
          <div className="text-center mb-8 relative z-10">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0066ff] to-[#58a6ff] blur-md opacity-50 animate-pulse" />
              <Avatar className="w-32 h-32 ring-4 ring-[#0066ff]/40 shadow-2xl relative">
                <AvatarFallback className="bg-gradient-to-br from-[#0066ff] via-[#121212] to-[#58a6ff] text-white text-4xl font-bold">
                  {activeParticipant.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="bg-[#20c937] px-4 py-0.5 rounded-full text-white text-[11px] font-bold shadow-lg flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Active Voice
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{activeParticipant.name}</h2>
            <p className="text-xs text-[#58a6ff] font-medium mb-2">{activeParticipant.role ?? 'Team Sync'}</p>
            <div className="text-sm font-semibold text-slate-400 bg-white/5 inline-block px-4 py-1 rounded-full border border-white/10">
              {formatTime(callDuration)}
            </div>
          </div>

          {/* Audio Waveform Visualization */}
          <div className="flex justify-center gap-2 mb-8 h-16 items-end relative z-10">
            {[40, 75, 50, 90, 60, 100, 45, 80, 55, 70, 35, 85].map((height, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-[#0066ff] to-[#58a6ff] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,102,255,0.5)]"
                style={{
                  height: isMuted ? '15%' : `${height}%`,
                  opacity: isMuted ? 0.3 : 1,
                  animation: isMuted ? 'none' : `pulse 1.2s infinite ease-in-out ${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center items-center gap-6 mb-4 relative z-10">
            <Button
              size="lg"
              className={`rounded-2xl w-16 h-16 transition-all ${
                isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)]' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              className="rounded-2xl w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-[0_4px_20px_rgba(239,68,68,0.5)] transition-all hover:scale-105"
              onClick={onClose}
              title="End Call"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            <Button
              size="lg"
              className={`rounded-2xl w-16 h-16 transition-all ${
                !isSpeakerOn ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              title={isSpeakerOn ? 'Mute Speaker' : 'Turn On Speaker'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>

          {/* Footer note */}
          <div className="text-center relative z-10">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#58a6ff]" /> TechIT Workspace Real-time Audio
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

