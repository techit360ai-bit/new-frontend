import { useCallback, useEffect, useState } from 'react';
import { fetchPostsPage } from '@/lib/messaging/feed';
import type { WirePost } from '@/lib/messaging/types';

export function useFeedPosts(zone: 'global' | 'tribe' = 'global', category = 'for-you') {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchPostsPage({ zone, category })
      .then(page => setPosts(page.posts))
      .catch((err) => {
        setPosts([]);
        setError(err instanceof Error ? err.message : 'Live posts are unavailable.');
      })
      .finally(() => setLoading(false));
  }, [zone, category]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, error, reload: load };
}
