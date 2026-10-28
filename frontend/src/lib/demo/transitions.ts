// Mirror of the backend demo status state machine (store.AllowedDemoTransition).
import type { DemoStatus } from "./types";

export const ALLOWED_TRANSITIONS: Record<string, DemoStatus[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["live", "cancelled"],
  live: ["ended", "cancelled"],
};

/** True if `to` is a permitted next status from `from`. */
export function canTransition(from: string, to: string): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to as DemoStatus);
}
