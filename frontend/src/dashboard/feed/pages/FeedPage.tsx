import { useEffect, useState } from 'react';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightPanel } from '../components/RightPanel';
import { ZoneSwitcher } from '../components/ZoneSwitcher';
import { PostComposer } from '../components/PostComposer';
import {
  MilestoneCard,
  InsightCard,
  CollabCallCard,
  BuildUpdateCard,
  ProblemSignalCard,
  QuestionCard,
} from '../components/FeedCards';
import { fetchPosts } from '@/lib/messaging/feed';
import type { WirePost } from '@/lib/messaging/types';

export function FeedPage() {
  const [activeZone, setActiveZone] = useState('Global Pulse');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('milestone');

  // WS6: zone-driven fetch. "Your Tribe" -> tribe; others fall through to global.
  const backendZone = activeZone === 'Your Tribe' ? 'tribe' : 'global';
  const [posts, setPosts] = useState<WirePost[]>([]);
  useEffect(() => {
    let alive = true;
    fetchPosts(backendZone).then((p) => { if (alive && p.length) setPosts(p); });
    return () => { alive = false; };
  }, [backendZone]);

  return (
    <div className="flex pb-14 lg:pb-0">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Feed */}
      <main className="flex-1 min-w-0 lg:max-w-[720px] lg:mx-auto w-full">
        {/* Zone Switcher */}
        <ZoneSwitcher active={activeZone} onChange={setActiveZone} />

        {/* Post Composer - Desktop only */}
        <div className="hidden lg:block px-4 pt-4">
          <PostComposer
            expanded={composerExpanded}
            setExpanded={setComposerExpanded}
            selectedType={selectedPostType}
            setSelectedType={setSelectedPostType}
          />
        </div>

        {/* Feed Stream — real posts when available, else mock cards (offline-safe) */}
        <div className="px-4 pb-8 space-y-3 pt-4 lg:pt-0">
          {posts.length > 0 ? (
            posts.map((p) => (
              <div key={p.id} className="bg-bg-surface border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <span className="capitalize text-accent-primary">{p.authorRole}</span>
                  <span>·</span>
                  <span className="capitalize">{p.kind}</span>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{p.body}</p>
              </div>
            ))
          ) : (
            <>
              <MilestoneCard postId="1" />
              <InsightCard postId="2" />
              <CollabCallCard postId="3" />
              <BuildUpdateCard postId="4" />
              <ProblemSignalCard postId="5" />
              <QuestionCard postId="6" />
            </>
          )}
        </div>
      </main>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
}
