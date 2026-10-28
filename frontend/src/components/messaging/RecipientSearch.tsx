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
    <div className="flex min-h-11 items-center gap-3 rounded-xl border border-emerald-500/30 bg-slate-900/80 px-4 py-2.5 shadow-md">
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-sm font-semibold text-slate-100">{selected.displayName || selected.name}<IdentityBadges verified={selected.verified} subscriber={selected.subscriber} credibilityScore={selected.credibilityScore} /></div><p className="text-xs text-slate-400">{selected.username ? `@${selected.username} · ` : ''}{selected.deliveryMode === 'request' ? 'Message request' : selected.sharedContext ? 'Shared TechIT context' : 'Direct message'}</p></div>
      <button type="button" onClick={() => { onSelect(null); setQuery(''); }} aria-label="Clear recipient" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"><X className="h-4 w-4" /></button>
    </div>
  );
  return (
    <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or @username" className={`h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${accentClass}`} />
      {(loading || results.length > 0 || query.trim().length >= 2) && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl py-2 shadow-2xl">{loading && <p className="px-4 py-3 text-sm text-slate-400">Searching members...</p>}{!loading && results.map(person => <button key={person.id} type="button" disabled={!person.canMessage} onClick={() => person.canMessage && onSelect(person)} className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">{(person.displayName || person.name || "").slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-slate-100">{person.displayName || person.name}<IdentityBadges verified={person.verified} subscriber={person.subscriber} credibilityScore={person.credibilityScore} compact /></span><span className="block truncate text-xs text-slate-400">{person.username ? `@${person.username} · ` : ''}{person.deliveryMode === 'direct' ? 'Direct message' : person.deliveryMode === 'request' ? 'Message request' : 'Connect first'}</span></span></button>)}{!loading && results.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No matching members found.</p>}</div>}
    </div>
  );

}
