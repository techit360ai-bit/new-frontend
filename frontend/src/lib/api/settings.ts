import { domainGet, domainPatch } from "@/lib/domainApi";

export async function fetchNotificationPreferences<T extends object>(
  scope: "founder" | "collaborator",
): Promise<Partial<T>> {
  const data = await domainGet<{ preferences?: Record<string, Partial<T>> }>("/notifications/preferences");
  return data.preferences?.[scope] ?? {};
}

export async function saveNotificationPreferences<T extends object>(
  scope: "founder" | "collaborator",
  preferences: T,
): Promise<T> {
  const data = await domainPatch<{ preferences?: Record<string, T> }>(
    "/notifications/preferences",
    { scope, preferences },
  );
  return data.preferences?.[scope] ?? preferences;
}
