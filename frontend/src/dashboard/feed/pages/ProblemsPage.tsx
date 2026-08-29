import { LivePostListPage } from '../components/LivePostListPage';

export function ProblemsPage() {
  return (
    <LivePostListPage
      title="Problem Signals"
      description="Problem signals published by members of the live TechIT community."
      kinds={['problem']}
      emptyTitle="No persisted problem signals yet"
      emptyDetail="Publish a problem signal from the feed composer when the community has a real problem to investigate."
    />
  );
}
