import { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, X, Maximize2, Radio } from 'lucide-react';
import { Avatar, AvatarFallback } from './avatar';
import { motion } from 'motion/react';

/**
 * VideoCallPIP - Picture-in-Picture video call window
 * Floating window that can be dragged around the screen
 */
export function VideoCallPIP() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-20 right-8 w-[340px] bg-[#121212]/95 backdrop-blur-2xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-[#0066ff]/40 overflow-hidden z-40 cursor-move"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Border Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0066ff] via-[#58a6ff] to-[#20c937]" />

      {/* Video Content */}
      <div className="relative aspect-video bg-[#0a0d14]">
        {isVideoOff ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-16 h-16 ring-2 ring-[#0066ff]/40">
              <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-xl font-bold">
                SC
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/20 via-[#121212] to-[#58a6ff]/20 flex items-center justify-center">
            <Avatar className="w-16 h-16 ring-4 ring-[#0066ff]/30 animate-pulse">
              <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-xl font-bold">
                SC
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Participant Info */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
          <span className="text-white text-xs font-semibold">Sarah Chen</span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#20c937]/20 border border-[#20c937]/40 px-2 py-0.5 rounded-full">
          <Radio className="w-2.5 h-2.5 text-[#20c937] animate-pulse" />
          <span className="text-[#20c937] text-[10px] font-bold">Live Sync</span>
        </div>

        {/* Your video (small overlay) */}
        <div className="absolute bottom-2.5 right-2.5 w-20 h-14 bg-[#121212] rounded-xl border border-white/20 overflow-hidden shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-[#0066ff]/30 to-[#121212] flex items-center justify-center">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-[10px] font-bold">
                You
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#121212] p-2.5 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition-all ${
              isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-2 rounded-xl transition-all ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all"
            title="Maximize"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            title="End call"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

