import { useEffect, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
import { searchMessageRecipients } from '@/lib/messaging/conversations';
import type { MessageIdentity } from '@/lib/messaging/types';
import { IdentityBadges } from './IdentityBadges';

export function MentionTextarea({ value, onChange, placeholder, rows = 3, className = '', containerClassName = 'w-full', autoFocus = false, onKeyDown }: { value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; className?: string; containerClassName?: string; autoFocus?: boolean; onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement> }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [suggestions, setSuggestions] = useState<MessageIdentity[]>([]);

  const updateQuery = (next: string, cursor: number) => {
    const before = next.slice(0, cursor);
    const match = before.match(/(?:^|\s)@([A-Za-z0-9_.-]{1,30})$/);
    if (!match || match[1].length < 2) { setQuery(''); setRange(null); setSuggestions([]); return; }
    setQuery(match[1]); setRange({ start: cursor - match[1].length - 1, end: cursor });
  };

  useEffect(() => {
    if (!query) return;
    const timer = window.setTimeout(() => {
      searchMessageRecipients(query).then(setSuggestions).catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const select = (person: MessageIdentity) => {
    if (!range || !person.username) return;
    const next = `${value.slice(0, range.start)}@${person.username} ${value.slice(range.end)}`;
    onChange(next); setQuery(''); setRange(null); setSuggestions([]);
    requestAnimationFrame(() => { const cursor = range.start + person.username!.length + 2; ref.current?.focus(); ref.current?.setSelectionRange(cursor, cursor); });
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <textarea ref={ref} value={value} rows={rows} autoFocus={autoFocus} placeholder={placeholder}
        onChange={(event) => { onChange(event.target.value); updateQuery(event.target.value, event.target.selectionStart); }}
        onClick={(event) => updateQuery(value, event.currentTarget.selectionStart)} onKeyDown={onKeyDown} className={className} />
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border-default bg-bg-surface py-1 shadow-xl">
          {suggestions.map(person => (
            <button key={person.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => select(person)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg-elevated">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-semibold text-accent-primary"><AtSign className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-sm font-medium text-text-primary">{person.displayName}<IdentityBadges verified={person.verified} subscriber={person.subscriber} credibilityScore={person.credibilityScore} compact /></span><span className="block truncate text-xs text-text-muted">@{person.username || 'member'} · {person.role || 'member'}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
