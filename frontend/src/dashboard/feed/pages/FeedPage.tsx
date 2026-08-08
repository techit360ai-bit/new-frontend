import { useMemo, useState } from 'react';
import { PenSquare } from 'lucide-react';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightPanel } from '../components/RightPanel';
import { ZoneSwitcher } from '../components/ZoneSwitcher';
import { PostComposer } from '../components/PostComposer';
import { LivePostCard } from '../components/LivePostCard';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';

const CATEGORY_IDS: Record<string, string> = {
  'For You': 'for-you', Following: 'following', Startups: 'startups', Funding: 'funding',
  Hackathons: 'hackathons', Organizations: 'organizations', Learning: 'learning', 'AI Recommendations': 'ai-recommendations',
};

export function FeedPage() {
  const [activeZone, setActiveZone] = useState('For You');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('milestone');
  const backendZone = activeZone === 'Following' ? 'tribe' : 'global';
  const { posts, loading, error, reload } = useFeedPosts(backendZone, CATEGORY_IDS[activeZone]);

  const visiblePosts = useMemo(() => {
    return posts;
  }, [posts]);

  const changeZone = (zone: string) => {
    setActiveZone(zone);
    if (zone === 'Learning') setSelectedPostType('insight');
    if (zone === 'Startups') setSelectedPostType('build-update');
    if (zone === 'Funding') setSelectedPostType('investment-signal');
  };

  return (
    <div className="flex pb-14 lg:pb-0">
      <LeftSidebar />
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px]">
        <ZoneSwitcher active={activeZone} onChange={changeZone} />

        <div className="px-4 pt-4">
          <PostComposer
            expanded={composerExpanded}
            setExpanded={setComposerExpanded}
            selectedType={selectedPostType}
            setSelectedType={setSelectedPostType}
            onCreated={reload}
          />
        </div>

        <div className="space-y-3 py-4 sm:px-4 lg:pt-0">
          {loading && <FeedLoadingState />}
          {!loading && error && <FeedErrorState message={error} />}
          {!loading && !error && visiblePosts.map((post) => (
            <LivePostCard key={post.id} post={post} />
          ))}
          {!loading && !error && visiblePosts.length === 0 && (
            <FeedEmptyState
              title={`No live posts in ${activeZone}`}
              detail="Persisted posts will appear here after a member publishes to this feed."
            />
          )}
        </div>
      </main>
      {!composerExpanded && (
        <button
          type="button"
          onClick={() => setComposerExpanded(true)}
          className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg hover:opacity-90 transition-opacity lg:bottom-6"
          aria-label="Create post"
        >
          <PenSquare className="h-6 w-6" />
        </button>
      )}
      <RightPanel />
    </div>
  );
}
