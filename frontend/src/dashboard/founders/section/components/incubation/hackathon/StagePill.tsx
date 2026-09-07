import { Check } from "lucide-react";

export type StageState = "active" | "completed" | "upcoming";

export function StagePill({
  index,
  label,
  state,
  onClick,
  compact = false,
}: {
  index: number;
  label: string;
  state: StageState;
  onClick?: () => void;
  compact?: boolean;
}) {
  const styles =
    state === "active"
      ? "border-[#0066ff] bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] font-bold shadow-sm"
      : state === "completed"
      ? "border-[#20c937]/40 bg-[#20c937]/10 text-[#20c937] font-semibold"
      : "border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-medium";

  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-2 border rounded-full ${
        compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
      } transition-all ${styles} ${onClick ? "hover:brightness-95 cursor-pointer" : ""}`}
      aria-current={state === "active" ? "step" : undefined}
    >
      <span
        className={`flex items-center justify-center rounded-full ${
          compact ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs"
        } font-semibold ${
          state === "completed"
            ? "bg-[#20c937] text-white"
            : state === "active"
            ? "bg-[#0066ff] text-white"
            : "bg-black/[0.06] dark:bg-white/10 text-slate-500 dark:text-slate-400"
        }`}
      >
        {state === "completed" ? <Check className="w-3 h-3" /> : index}
      </span>
      <span>{label}</span>
    </Tag>
  );
}
