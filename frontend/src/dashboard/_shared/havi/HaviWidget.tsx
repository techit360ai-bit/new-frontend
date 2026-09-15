import { useRef, useState } from "react";

import { motion, type PanInfo } from "motion/react";

export type HaviStatus = "idle" | "active" | "alert" | "celebration";

interface HaviWidgetProps {
  status: HaviStatus;
  daysRemaining: number;
  overdue: boolean;
  message: string;
  onOpen: () => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const STATUS_STYLES: Record<HaviStatus, { border: string; glow: string; dot: string; icon: string }> = {
  idle: { border: "border-[#20C997]/20", glow: "shadow-sm", dot: "bg-[#20C997]", icon: "text-[#20C997]" },
  active: { border: "border-[#20C997]/40", glow: "shadow-sm", dot: "bg-[#20C997]", icon: "text-[#20C997]" },
  alert: { border: "border-amber-500/40", glow: "shadow-sm", dot: "bg-amber-500", icon: "text-amber-500" },
  celebration: { border: "border-[#20C997]/50", glow: "shadow-md", dot: "bg-[#20C997]", icon: "text-[#20C997]" },
};

export function HaviWidget({
  status,
  daysRemaining,
  overdue,
  message,
  onOpen,
  position,
  onPositionChange,
}: HaviWidgetProps) {
  const s = STATUS_STYLES[status];
  const draggedRef = useRef(false);

  const handleDragStart = () => {
    draggedRef.current = true;
  };

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    onPositionChange({ x: position.x + info.offset.x, y: position.y + info.offset.y });
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleClick = () => {
    if (draggedRef.current) return;
    onOpen();
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.04}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ y: 80, opacity: 0 }}
      animate={{ x: position.x, y: position.y, opacity: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 220 }}
      className="fixed bottom-[10px] right-[10px] sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-[120] cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border ${s.border} ${s.glow} transition-all hover:scale-105 active:scale-95 group overflow-hidden`}
        aria-label="Open Havi"
      >
        <div className="absolute inset-0 bg-[#20C997]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <img 
          src="/bot-icon.png" 
          alt="Havi" 
          className="h-8 w-8 object-contain drop-shadow-sm transition-transform group-hover:scale-105" 
        />
        
        <span
          className={`absolute -right-1 -top-1 h-3.5 w-3.5 ${s.dot} rounded-full border-2 border-white dark:border-[#111111] shadow-sm`}
        />
      </button>
    </motion.div>
  );
}
