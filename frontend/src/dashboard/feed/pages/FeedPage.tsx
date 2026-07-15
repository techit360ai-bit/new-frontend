import { useMemo, useState } from 'react';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightPanel } from '../components/RightPanel';
import { ZoneSwitcher } from '../components/ZoneSwitcher';
import { PostComposer } from '../components/PostComposer';
import { LivePostCard } from '../components/LivePostCard';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';

const FILTER_KINDS: Record<string, string[] | null> = {
  'Global Pulse': null,
  'Your Tribe': null,
  'Build Logs': ['milestone', 'build-update', 'build', 'update'],
  Questions: ['question'],
  Problems: ['problem'],
};

export function FeedPage() {
  const [activeZone, setActiveZone] = useState('Global Pulse');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('milestone');
  const backendZone = activeZone === 'Your Tribe' ? 'tribe' : 'global';
  const { posts, loading, error, reload } = useFeedPosts(backendZone);

  const visiblePosts = useMemo(() => {
    const kinds = FILTER_KINDS[activeZone];
    return kinds ? posts.filter((post) => kinds.includes(post.kind)) : posts;
  }, [activeZone, posts]);

  const changeZone = (zone: string) => {
    setActiveZone(zone);
    if (zone === 'Questions') setSelectedPostType('question');
    if (zone === 'Problems') setSelectedPostType('problem');
    if (zone === 'Build Logs') setSelectedPostType('build-update');
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
      <RightPanel />
    </div>
  );
}
