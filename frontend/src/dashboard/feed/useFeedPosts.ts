import { useCallback, useEffect, useState } from 'react';
import { fetchPostsPage } from '@/lib/messaging/feed';
import type { WirePost } from '@/lib/messaging/types';
import { cacheSnapshot, readSnapshot } from '@/lib/resilience/cache';
import { failureMessage } from '@/lib/resilience/connectivity';

export function useFeedPosts(zone: 'global' | 'tribe' = 'global', category = 'for-you') {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const key = `feed:${zone}:${category}`;
    return fetchPostsPage({ zone, category })
      .then(page => { setPosts(page.posts); setStale(false); setLastSyncedAt(new Date().toISOString()); void cacheSnapshot(key, page.posts); })
      .catch((err) => {
        return readSnapshot<WirePost[]>(key).then(snapshot => {
          if (snapshot) { setPosts(snapshot.value); setStale(true); setLastSyncedAt(snapshot.updatedAt); setError(null); }
          else { setPosts([]); setError(failureMessage(err, 'feed')); }
        });
      })
      .finally(() => setLoading(false));
  }, [zone, category]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh automatically when connectivity returns, so a stale/empty feed
  // recovers without a manual pull-to-refresh.
  useEffect(() => {
    const onOnline = () => { void load(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  return { posts, loading, error, stale, lastSyncedAt, reload: load };
}
