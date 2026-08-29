import { useEffect, useMemo, useState } from 'react';
import { PenSquare } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightPanel } from '../components/RightPanel';
import { ZoneSwitcher } from '../components/ZoneSwitcher';
import { PostComposer } from '../components/PostComposer';
import { LivePostCard } from '../components/LivePostCard';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';
import { useAuth } from '@/contexts/AuthContext';
import { syncDiscoveryProfile } from '@/lib/messaging/discovery';
import {
  completeCatchUp,
  getReturnSummary,
  listRecommendations,
  markCatchUpItem,
  recordDiscoveryActivity,
  recordRecommendationExposure,
  sendRecommendationFeedback,
  syncRecommendationProfile,
  type DiscoveryRecommendation,
  type ReturnSummary,
} from '@/lib/api/discovery';
import { RecommendationCard } from '../components/RecommendationCard';
import { CaughtUpNotice, ReturnSummaryBanner } from '../components/ReturnIntelligence';
import { VirtualizedList } from '@/components/mobile/VirtualizedList';
import { FeedSearchPopover } from '../components/FeedSearchPopover';

const CATEGORY_IDS: Record<string, string> = {
  'For You': 'for-you', Following: 'following', Startups: 'startups', Funding: 'funding',
  Hackathons: 'hackathons', Organizations: 'organizations', Learning: 'learning', 'AI Recommendations': 'ai-recommendations',
};

export function FeedPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeZone, setActiveZone] = useState('For You');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('milestone');
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>([]);
  const [returnSummary, setReturnSummary] = useState<ReturnSummary | null>(null);
  const [catchUpMode, setCatchUpMode] = useState(false);
  const [caughtUp, setCaughtUp] = useState(false);
  const [feedSearchOpen, setFeedSearchOpen] = useState(false);
  const backendZone = activeZone === 'Following' ? 'tribe' : 'global';
  const { posts, loading, error, reload } = useFeedPosts(backendZone, CATEGORY_IDS[activeZone]);

  useEffect(() => {
    if (!profile) return;
    void syncDiscoveryProfile({ location: profile.country, skills: profile.skills, industries: profile.industries, interests: profile.investmentFocus });
    void syncRecommendationProfile({
      skills: profile.skills,
      interests: [...(profile.industries || []), ...(profile.investmentFocus || [])],
      preferredIndustries: profile.industries,
      preferredCollaboration: [profile.commitmentStyle, profile.timezone].filter(Boolean),
    }).catch(() => undefined);
  }, [profile]);

  useEffect(() => {
    let alive = true;
    getReturnSummary()
      .then(summary => { if (alive) { setReturnSummary(summary); if (summary.available && searchParams.get('catchup') === '1') setCatchUpMode(true); } })
      .catch(() => { if (alive) setReturnSummary(null); })
      .finally(() => { void recordDiscoveryActivity('feed_visit', 'feed').catch(() => undefined); });
    listRecommendations({ surface: 'feed', limit: 6 })
      .then(result => {
        if (!alive) return;
        setRecommendations(result.recommendations);
        result.recommendations.slice(0, 3).forEach(item => { void recordRecommendationExposure(item.id, 'impression', 'feed').catch(() => undefined); });
      })
      .catch(() => { if (alive) setRecommendations([]); });
    return () => { alive = false; };
  }, [searchParams]);

  const visiblePosts = useMemo(() => {
    return posts;
  }, [posts]);

  const changeZone = (zone: string) => {
    setActiveZone(zone);
    if (zone === 'Learning') setSelectedPostType('insight');
    if (zone === 'Startups') setSelectedPostType('build-update');
    if (zone === 'Funding') setSelectedPostType('investment-signal');
  };

  const dismissRecommendation = (recommendation: DiscoveryRecommendation) => {
    setRecommendations(current => current.filter(item => item.id !== recommendation.id));
    void sendRecommendationFeedback(recommendation.id, 'not_interested').catch(() => undefined);
  };

  const finishCatchUp = () => {
    void completeCatchUp()
      .then(() => {
        setCatchUpMode(false);
        setCaughtUp(true);
        setReturnSummary(current => current ? { ...current, available: false, completed: true } : current);
      })
      .catch(() => undefined);
  };

  return (
    <div className="flex pb-14 lg:pb-0">
      <LeftSidebar />
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px]">
        <div className="relative"><ZoneSwitcher active={activeZone} onChange={changeZone} onSearch={() => setFeedSearchOpen(current => !current)} />{feedSearchOpen && <FeedSearchPopover onClose={() => setFeedSearchOpen(false)} />}</div>

        {catchUpMode && returnSummary ? (
          <div className="space-y-4 px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-accent-primary">Catch-Up Mode</p>
                <h1 className="mt-1 text-lg font-semibold text-text-primary">{returnSummary.headline}</h1>
              </div>
              <button type="button" onClick={finishCatchUp} className="h-9 rounded-md border border-border-default px-3 text-xs font-semibold text-text-primary hover:bg-bg-elevated">Finish</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {returnSummary.items.map(item => (
                <RecommendationCard
                  key={item.id}
                  recommendation={item}
                  onDismiss={(recommendation) => {
                    setReturnSummary(current => current ? { ...current, items: current.items.filter(row => row.id !== recommendation.id) } : current);
                    void markCatchUpItem(recommendation.id, 'dismissed').catch(() => undefined);
                  }}
                  onAction={(recommendation, action) => {
                    void markCatchUpItem(recommendation.id, 'seen').catch(() => undefined);
                    void recordRecommendationExposure(recommendation.id, action, 'return-intelligence').catch(() => undefined);
                  }}
                />
              ))}
            </div>
            <button type="button" onClick={finishCatchUp} className="w-full rounded-md bg-accent-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">You're all caught up</button>
          </div>
        ) : (
          <>
            {returnSummary?.available && <div className="pt-4 sm:px-4"><ReturnSummaryBanner summary={returnSummary} onStart={() => setCatchUpMode(true)} /></div>}
            {caughtUp && <div className="pt-4 sm:px-4"><CaughtUpNotice /></div>}

            <div className="px-4 pt-4">
              <PostComposer
                expanded={composerExpanded}
                setExpanded={setComposerExpanded}
                selectedType={selectedPostType}
                setSelectedType={setSelectedPostType}
                onCreated={reload}
              />
            </div>

            {recommendations.length > 0 && (
              <section className="px-4 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">Recommended for you</h2>
                  <Link to="/feed/discover" className="text-xs font-medium text-accent-primary hover:underline">See all</Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendations.slice(0, 3).map(item => (
                    <RecommendationCard
                      key={item.id}
                      recommendation={item}
                      onDismiss={dismissRecommendation}
                      onAction={(recommendation, action) => void recordRecommendationExposure(recommendation.id, action, 'feed').catch(() => undefined)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="space-y-3 py-4 sm:px-4 lg:pt-0">
              {loading && <FeedLoadingState />}
              {!loading && error && <FeedErrorState message={error} />}
              {!loading && !error && (
                <VirtualizedList
                  items={visiblePosts}
                  threshold={30}
                  useWindowScroll
                  itemContent={(_, post) => <div className="pb-3"><LivePostCard key={post.id} post={post} /></div>}
                />
              )}
              {!loading && !error && visiblePosts.length === 0 && (
                <FeedEmptyState
                  title={`No live posts in ${activeZone}`}
                  detail="Persisted posts will appear here after a member publishes to this feed."
                />
              )}
            </div>
          </>
        )}
      </main>
      {!catchUpMode && !composerExpanded && (
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
