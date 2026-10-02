import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { Mention } from '@/lib/messaging/types';

function escapePattern(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function MentionText({ body, mentions = [], className = '' }: { body: string; mentions?: Mention[]; className?: string }) {
  const byUsername = new Map(mentions.map(item => [item.username.toLowerCase(), item]));
  if (byUsername.size === 0) return <span className={className}>{body}</span>;
  const expression = new RegExp(`(@(?:${[...byUsername.keys()].map(escapePattern).join('|')}))(?![A-Za-z0-9_.-])`, 'gi');
  const parts = body.split(expression);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const item = part.startsWith('@') ? byUsername.get(part.slice(1).toLowerCase()) : undefined;
        return item ? <Link key={`${item.userId}-${index}`} to={`/feed/profile/${encodeURIComponent(item.userId)}`} className="font-medium text-accent-primary hover:underline">{part}</Link> : <Fragment key={index}>{part}</Fragment>;
      })}
    </span>
  );
}
