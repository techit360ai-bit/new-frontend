// Theme-aware class helpers for the Mentorship Hub.
//
// The hub must look like the original prototype in light mode (white surfaces,
// blue accent) and like the investor section in dark mode (charcoal surfaces,
// emerald accent). Rather than scatter hardcoded `blue-600 dark:emerald-500`
// pairs across seven pages, every accent lives here once. Pages compose these
// constants so re-theming is a single-file change.
//
// Surfaces themselves use the app's semantic tokens (bg-background, bg-card,
// text-foreground, text-muted-foreground, border-border) which already flip
// with the global `.dark` class — see frontend/src/index.css.

/** Solid accent button (primary call-to-action). */
export const ACCENT_SOLID =
  "bg-action-primary hover:bg-action-primary text-white dark:bg-status-success dark:hover:bg-status-success dark:text-black";

/** Accent text / links. */
export const ACCENT_TEXT = "text-status-info hover:text-status-info dark:text-status-success dark:hover:text-status-success";

/** Soft accent chip (skills, tags, highlights). */
export const ACCENT_SOFT =
  "bg-status-info-soft text-status-info dark:bg-status-success/10 dark:text-status-success";

/** Accent progress-bar fill. */
export const ACCENT_FILL = "bg-action-primary dark:bg-status-success";

/** Welcome / hero banner gradient. */
export const HERO_GRADIENT =
  "bg-gradient-to-r from-brand-primary to-status-pending dark:from-emerald-600 dark:to-teal-700 text-white";

/** Advanced-hub hero gradient (distinct from the primary hero). */
export const HUB_GRADIENT =
  "bg-gradient-to-r from-status-pending to-pink-600 dark:from-violet-700 dark:to-fuchsia-800 text-white";

/** Neutral outline button (cancel / secondary actions). */
export const NEUTRAL_BTN =
  "border border-border bg-transparent hover:bg-accent text-foreground transition-colors";

/** Recharts stroke/fill colors (no Tailwind here — read once at render). */
export const CHART_PRIMARY = "#3b82f6"; // blue-500
export const CHART_SECONDARY = "#8b5cf6"; // violet-500

/**
 * Status → badge classes. Theme-aware so colored status pills stay legible on
 * both light and dark surfaces.
 */
export function statusBadge(status: string): string {
  switch (status) {
    case "completed":
    case "active":
    case "accepted":
      return "bg-status-success text-status-success dark:bg-status-success/15 dark:text-status-success";
    case "in-progress":
    case "processing":
      return "bg-status-info text-status-info dark:bg-status-info/15 dark:text-status-info";
    case "pending":
    case "invited":
      return "bg-status-warning text-status-warning dark:bg-status-warning/15 dark:text-status-warning";
    case "overdue":
    case "rejected":
      return "bg-status-error text-status-error dark:bg-status-error/15 dark:text-status-error";
    case "vested":
      return "bg-status-pending text-status-pending dark:bg-status-pending/15 dark:text-status-pending";
    default:
      return "bg-muted text-muted-foreground";
  }
}
