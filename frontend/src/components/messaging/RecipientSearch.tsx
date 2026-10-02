import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchMessageRecipients } from '@/lib/messaging/conversations';
import type { MessageIdentity } from '@/lib/messaging/types';
import { IdentityBadges } from './IdentityBadges';

export function RecipientSearch({ selected, onSelect, accentClass = 'focus:border-accent-primary' }: { selected: MessageIdentity | null; onSelect: (person: MessageIdentity | null) => void; accentClass?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageIdentity[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (selected || query.trim().length < 2) { setResults([]); return; }
    const timer = window.setTimeout(() => { setLoading(true); searchMessageRecipients(query.trim()).then(setResults).catch(() => setResults([])).finally(() => setLoading(false)); }, 180);
    return () => window.clearTimeout(timer);
  }, [query, selected]);
  if (selected) return (
    <div className="flex min-h-10 items-center gap-3 rounded-lg border border-border-default px-3 py-2">
      <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">{selected.displayName}<IdentityBadges verified={selected.verified} subscriber={selected.subscriber} credibilityScore={selected.credibilityScore} /></div><p className="text-xs text-text-muted">{selected.username ? `@${selected.username} · ` : ''}{selected.deliveryMode === 'request' ? 'Message request' : selected.sharedContext ? 'Shared TechIT context' : 'Direct message'}</p></div>
      <button type="button" onClick={() => { onSelect(null); setQuery(''); }} aria-label="Clear recipient" className="rounded p-1 text-text-muted hover:bg-surface-secondary"><X className="h-4 w-4" /></button>
    </div>
  );
  return (
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or @username" className={`h-10 w-full rounded-lg border border-border-default bg-surface-primary pl-9 pr-3 text-sm text-text-primary outline-none ${accentClass}`} />
      {(loading || results.length > 0 || query.trim().length >= 2) && <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border-default bg-surface-primary py-1 shadow-xl">{loading && <p className="px-3 py-3 text-sm text-text-muted">Searching members...</p>}{!loading && results.map(person => <button key={person.id} type="button" disabled={!person.canMessage} onClick={() => person.canMessage && onSelect(person)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-55"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-semibold text-accent-primary">{person.displayName.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-sm font-medium text-text-primary">{person.displayName}<IdentityBadges verified={person.verified} subscriber={person.subscriber} credibilityScore={person.credibilityScore} compact /></span><span className="block truncate text-xs text-text-muted">{person.username ? `@${person.username} · ` : ''}{person.deliveryMode === 'direct' ? 'Direct message' : person.deliveryMode === 'request' ? 'Message request' : 'Connect first'}</span></span></button>)}{!loading && results.length === 0 && <p className="px-3 py-3 text-sm text-text-muted">No matching members found.</p>}</div>}
    </div>
  );
}
