import { useState } from "react";
import {
  Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, Video, Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  title: string;
  duration: string;
  onPlay?: () => void;
  onPause?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({ title, duration, onPlay, onPause }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mode, setMode] = useState<"audio" | "video">("audio");

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) onPlay?.();
    else onPause?.();
  };

  const handleSpeedChange = () => {
    const currentIndex = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(currentIndex + 1) % SPEEDS.length]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="p-5">
        {/* Header row with audio/video mode toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff]">
              <Volume2 className="size-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {mode === "audio" ? "Audio Lesson" : "Video Lesson"} • {duration}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Audio / Video mode toggle */}
            <div className="flex items-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/10 p-0.5 mr-1">
              <button
                onClick={() => setMode("audio")}
                aria-label="Audio mode"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  mode === "audio"
                    ? "bg-[#0066ff] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Volume2 className="size-3" />
                Audio
              </button>
              <button
                onClick={() => setMode("video")}
                aria-label="Video mode (coming soon)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  mode === "video"
                    ? "bg-[#0066ff] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Video className="size-3" />
                Video
              </button>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 overflow-hidden pt-1"
            >
              {mode === "video" ? (
                /* Video — future option, shown as coming-soon placeholder */
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/[0.08] dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] py-8 text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0066ff]/10 text-[#0066ff]">
                    <Lock className="size-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Video lessons coming soon</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Watch this lesson as a guided video walkthrough. We're producing video
                    content now — switch to Audio to listen today.
                  </p>
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <Slider
                      value={[progress]}
                      onValueChange={(value) => setProgress(value[0])}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span>{formatTime(Math.floor((progress / 100) * 180))}</span>
                      <span>3:00</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePlayPause}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold text-xs px-3.5 py-2 shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
                      >
                        {isPlaying ? (
                          <Pause className="size-3.5" />
                        ) : (
                          <Play className="size-3.5 ml-0.5" />
                        )}
                        <span>{isPlaying ? "Pause" : "Play"}</span>
                      </button>

                      <button
                        onClick={handleSpeedChange}
                        className="rounded-xl border border-black/[0.08] dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      >
                        {speed}x
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>
                    </div>

                    <div className="text-[11px] font-semibold text-[#0066ff] dark:text-[#58a6ff] bg-[#0066ff]/10 dark:bg-[#0066ff]/20 px-2.5 py-1 rounded-full">
                      Listen while working
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
