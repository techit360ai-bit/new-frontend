import { useRef, useState } from "react";
import { Bot, Sparkles, GripVertical } from "lucide-react";
import { motion, type PanInfo } from "motion/react";

export type HaviStatus = "idle" | "active" | "alert" | "celebration";

interface HaviWidgetProps {
  status: HaviStatus;
  daysRemaining: number;
  overdue: boolean;
  message: string;
  onOpen: () => void;
  /** Persisted starting offset {x, y} relative to bottom-right anchor. */
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const STATUS_STYLES: Record<HaviStatus, { ring: string; dot: string }> = {
  idle: { ring: "border-border-strong", dot: "bg-slate-400" },
  active: { ring: "border-cyan-400 shadow-lg shadow-cyan-200/50", dot: "bg-cyan-500" },
  alert: { ring: "border-status-warning shadow-lg shadow-amber-200/50", dot: "bg-status-warning" },
  celebration: { ring: "border-status-pending shadow-lg shadow-purple-200/50", dot: "bg-status-pending" },
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
    // Allow click again shortly after the drag settles.
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleClick = () => {
    if (draggedRef.current) return; // ignore the click that ends a drag
    onOpen();
  };

  const countdownLabel = overdue
    ? `${Math.abs(daysRemaining)}d over`
    : daysRemaining === 0
    ? "MVP day"
    : `${daysRemaining}d to MVP`;

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
      className="fixed bottom-20 right-14 z-[120] cursor-grab select-none active:cursor-grabbing sm:right-16 lg:bottom-4"
      style={{ touchAction: "none" }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`flex size-9 items-center justify-center rounded-lg border bg-surface-primary p-0 ${s.ring} transition-all hover:scale-[1.03] sm:size-10`}
        aria-label="Open Havi"
      >
        {/* drag affordance */}
        <GripVertical className="hidden h-3 w-3 text-text-on-inverse-secondary" />

        <div className="relative shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-brand-primary">
            {status === "celebration" ? (
              <Sparkles className="h-3.5 w-3.5 text-white" />
            ) : (
              <Bot className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 ${s.dot} rounded-full border border-white`}
          />
        </div>

        <div className="hidden max-w-[180px] flex-col items-start text-left">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            Havi
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                overdue ? "bg-status-warning-soft text-status-warning" : "bg-cyan-100 text-cyan-700"
              }`}
            >
              {countdownLabel}
            </span>
          </span>
          <span className="text-xs text-text-muted line-clamp-1">{message}</span>
        </div>
      </button>
    </motion.div>
  );
}
