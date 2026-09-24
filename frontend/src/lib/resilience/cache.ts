import { get, put, type ResilienceSnapshot } from './store';

export async function cacheSnapshot<T>(key: string, value: T, expiresAt?: string): Promise<void> {
  await put<ResilienceSnapshot<T>>('snapshots', { key, value, updatedAt: new Date().toISOString(), expiresAt });
}

export async function readSnapshot<T>(key: string): Promise<(ResilienceSnapshot<T> & { stale: boolean }) | null> {
  const snapshot = await get<ResilienceSnapshot<T>>('snapshots', key);
  if (!snapshot) return null;
  return { ...snapshot, stale: Boolean(snapshot.expiresAt && Date.now() > new Date(snapshot.expiresAt).getTime()) };
}
