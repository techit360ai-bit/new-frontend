import { useCallback, useEffect, useState } from 'react';
import { fetchPosts } from '@/lib/messaging/feed';
import type { WirePost } from '@/lib/messaging/types';

export function useFeedPosts(zone: 'global' | 'tribe' = 'global') {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchPosts(zone)
      .then(setPosts)
      .catch((err) => {
        setPosts([]);
        setError(err instanceof Error ? err.message : 'Live posts are unavailable.');
      })
      .finally(() => setLoading(false));
  }, [zone]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, error, reload: load };
}
