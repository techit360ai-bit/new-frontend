// Theme-aware class helpers for the Mentorship Hub with unified #20C997 mint theme.

/** Solid accent button (primary call-to-action). */
export const ACCENT_SOLID =
  "bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold transition-all shadow-sm";

/** Accent text / links. */
export const ACCENT_TEXT = "text-[#20C997] hover:text-[#1db587] font-semibold transition-colors";

/** Soft accent chip (skills, tags, highlights). */
export const ACCENT_SOFT =
  "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 font-semibold";

/** Accent progress-bar fill. */
export const ACCENT_FILL = "bg-[#20C997]";

/** Welcome / hero banner gradient. */
export const HERO_GRADIENT =
  "bg-gradient-to-r from-[#20C997]/90 to-[#128a66] text-slate-950 font-bold";

/** Advanced-hub hero gradient (distinct from the primary hero). */
export const HUB_GRADIENT =
  "bg-gradient-to-r from-[#20C997] to-[#0f7657] text-slate-950 font-bold";

/** Neutral outline button (cancel / secondary actions). */
export const NEUTRAL_BTN =
  "border border-border bg-transparent hover:bg-accent text-foreground transition-colors";

/** Recharts stroke/fill colors (no Tailwind here — read once at render). */
export const CHART_PRIMARY = "#20C997";
export const CHART_SECONDARY = "#0f7657";

/**
 * Status → badge classes. Theme-aware so colored status pills stay legible on
 * both light and dark surfaces.
 */
export function statusBadge(status: string): string {
  switch (status) {
    case "completed":
    case "active":
    case "accepted":
      return "bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30 font-bold";
    case "in-progress":
    case "processing":
      return "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 font-semibold";
    case "pending":
    case "invited":
      return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-semibold";
    case "overdue":
    case "rejected":
      return "bg-red-500/15 text-red-600 dark:text-red-400 font-semibold";
    case "vested":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold";
    default:
      return "bg-muted text-muted-foreground";
  }
}
