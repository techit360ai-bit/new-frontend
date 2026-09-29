import { get, put, list, remove, type ResilienceSnapshot } from './store';

// Snapshots hold private, server-derived data (conversations, channel history,
// feed, workspace state). A browser can be shared or reused by more than one
// TechIT account, so a key that names only the resource lets the next account
// read the previous account's cached data from DevTools -> Application ->
// IndexedDB. The account id is folded into the key inside this module so every
// caller is covered without changing call sites.
let scope: string | null = null;

/** Sets the active account for cache keys and drops snapshots that belong to a
 *  previous account. Called on sign-in, sign-out and session bootstrap. */
export function setCacheScope(userId: string | null): void {
  const next = userId || null;
  if (next === scope) return;
  scope = next;
  void purgeSnapshots();
}

function scoped(key: string): string {
  return `${scope ?? 'anon'}:${key}`;
}

async function purgeSnapshots(): Promise<void> {
  try {
    const rows = await list<{ key: string }>('snapshots');
    await Promise.all(rows.map(row => remove('snapshots', row.key)));
  } catch {
    // Storage unavailable: nothing was persisted, so there is nothing to leak.
  }
}

export async function cacheSnapshot<T>(key: string, value: T, expiresAt?: string): Promise<void> {
  await put<ResilienceSnapshot<T>>('snapshots', { key: scoped(key), value, updatedAt: new Date().toISOString(), expiresAt });
}

export async function readSnapshot<T>(key: string): Promise<(ResilienceSnapshot<T> & { stale: boolean }) | null> {
  const snapshot = await get<ResilienceSnapshot<T>>('snapshots', scoped(key));
  if (!snapshot) return null;
  return { ...snapshot, stale: Boolean(snapshot.expiresAt && Date.now() > new Date(snapshot.expiresAt).getTime()) };
}
