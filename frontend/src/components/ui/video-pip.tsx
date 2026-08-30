import { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, X, Maximize2 } from 'lucide-react';
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
      className="fixed bottom-20 right-8 w-[320px] bg-brand-secondary rounded-xl shadow-2xl overflow-hidden z-40 cursor-move"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video Content */}
      <div className="relative aspect-video bg-background-inverse">
        {isVideoOff ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-brand-primary text-white text-2xl">
                SC
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50" />
        )}
        
        {/* Participant Info */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <span className="text-white text-sm font-medium">Sarah Chen</span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-status-error px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-surface-primary rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">Live</span>
        </div>

        {/* Your video (small overlay) */}
        <div className="absolute bottom-3 right-3 w-20 h-14 bg-surface-inverse-muted rounded-lg border-2 border-white/20 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-status-success text-white text-xs">
                You
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-brand-secondary p-3 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg transition-colors ${
              isMuted ? 'bg-status-error text-white' : 'bg-surface-primary/10 text-white hover:bg-surface-primary/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-2 rounded-lg transition-colors ${
              isVideoOff ? 'bg-status-error text-white' : 'bg-surface-primary/10 text-white hover:bg-surface-primary/20'
            }`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 bg-surface-primary/10 text-white hover:bg-surface-primary/20 rounded-lg transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 bg-status-error/20 text-status-error hover:bg-status-error hover:text-white rounded-lg transition-colors"
            title="End call"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-status-pending" />
    </motion.div>
  );
}
