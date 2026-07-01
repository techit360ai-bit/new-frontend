import type { HaviRole } from "./haviData";

interface HaviStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const FIRST_LANDING_KEY = (role: HaviRole) => `techit:havi:first-landing:${role}`;

function defaultStorage(): HaviStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function claimFirstLanding(
  role: HaviRole,
  storage: HaviStorage | null = defaultStorage(),
  now = new Date(),
): boolean {
  if (!storage) return false;
  const key = FIRST_LANDING_KEY(role);
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, now.toISOString());
    return true;
  } catch {
    return false;
  }
}
