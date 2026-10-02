import { AlertCircle, Inbox } from 'lucide-react';

export function FeedLoadingState({ label = 'Loading live posts...' }: { label?: string }) {
  return <p className="px-4 py-10 text-center text-sm text-text-muted">{label}</p>;
}

export function FeedErrorState({ message }: { message: string }) {
  return (
    <div className="mx-4 my-6 flex items-start gap-3 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function FeedEmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="mx-4 my-8 flex flex-col items-center justify-center gap-2 border-y border-border-default py-12 text-center">
      <Inbox className="h-7 w-7 text-text-muted" />
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="max-w-sm text-xs text-text-muted">{detail}</p>
    </div>
  );
}
