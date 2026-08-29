import { LivePostListPage } from '../components/LivePostListPage';

export function QuestionsPage() {
  return (
    <LivePostListPage
      title="Questions & Answers"
      description="Questions published by the live TechIT community."
      kinds={['question']}
      emptyTitle="No persisted questions yet"
      emptyDetail="Publish a question from the feed composer to start a live discussion."
    />
  );
}
