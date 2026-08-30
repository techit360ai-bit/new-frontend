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
    <Card className="overflow-hidden border-brand-accent bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="p-4">
        {/* Header row with audio/video mode toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="size-5 text-brand-accent" />
            <div>
              <h4 className="font-medium text-text-primary">{title}</h4>
              <p className="text-xs text-text-muted">
                {mode === "audio" ? "Audio Lesson" : "Video Lesson"} • {duration}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Audio / Video mode toggle */}
            <div className="flex items-center rounded-lg bg-surface-primary/70 border border-brand-accent p-0.5 mr-1">
              <button
                onClick={() => setMode("audio")}
                aria-label="Audio mode"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  mode === "audio"
                    ? "bg-brand-accent text-white"
                    : "text-brand-accent hover:bg-status-info-soft"
                }`}
              >
                <Volume2 className="size-3.5" />
                Audio
              </button>
              <button
                onClick={() => setMode("video")}
                aria-label="Video mode (coming soon)"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  mode === "video"
                    ? "bg-brand-accent text-white"
                    : "text-brand-accent hover:bg-status-info-soft"
                }`}
              >
                <Video className="size-3.5" />
                Video
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 overflow-hidden"
            >
              {mode === "video" ? (
                /* Video — future option, shown as coming-soon placeholder */
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-accent bg-surface-primary/60 py-8 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-status-info-soft">
                    <Lock className="size-5 text-brand-accent" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Video lessons coming soon</p>
                  <p className="text-xs text-text-muted max-w-xs">
                    Watch this lesson as a guided video walkthrough. We're producing video
                    content now — switch to Audio to listen today.
                  </p>
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[progress]}
                      onValueChange={(value) => setProgress(value[0])}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{formatTime(Math.floor((progress / 100) * 180))}</span>
                      <span>3:00</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handlePlayPause}
                        className="bg-brand-accent hover:bg-brand-accent text-white"
                      >
                        {isPlaying ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4 ml-0.5" />
                        )}
                        <span className="ml-2">{isPlaying ? "Pause" : "Play"}</span>
                      </Button>

                      <Button variant="outline" size="sm" onClick={handleSpeedChange}>
                        {speed}x
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                        className="h-8 w-8 p-0"
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </Button>
                    </div>

                    <div className="text-xs text-text-muted bg-status-info-soft px-2 py-1 rounded">
                      Listen while working
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
