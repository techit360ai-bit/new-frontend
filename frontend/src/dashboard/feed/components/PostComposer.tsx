import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { createPost } from '@/lib/messaging/feed';
import { VIEWER_ROLES, normalizeRole } from '@/lib/messaging/roles';
import { kindsForRole, KIND_META } from '@/lib/messaging/postKinds';
import { useAuth } from '@/contexts/AuthContext';

export function PostComposer({ expanded, setExpanded, selectedType, setSelectedType }: { expanded: boolean; setExpanded: (v: boolean) => void; selectedType: string; setSelectedType: (v: string) => void }) {
  const { profile } = useAuth();
  const viewerRole = normalizeRole(profile?.role);
  const postTypes = kindsForRole(viewerRole).map((k) => ({
    id: k,
    label: `${KIND_META[k].emoji} ${KIND_META[k].label}`,
  }));

  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<string[]>([]); // [] = Everyone
  const targetRoles = VIEWER_ROLES.filter((r) => r !== 'community');
  const toggleAudience = (role: string) =>
    setAudience((cur) => (cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role]));
  const handlePost = () => {
    if (!body.trim()) return;
    void createPost(selectedType, body.trim(), audience.length ? audience : undefined);
    setBody('');
    setAudience([]);
    setExpanded(false);
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4 mb-4">
      {expanded && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
          {postTypes.map((type) => (
            <button key={type.id} onClick={() => setSelectedType(type.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedType === type.id ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-transparent border-border-default text-text-secondary hover:border-border-active'}`}>
              {type.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary to-score-purple flex-shrink-0"></div>
        <div className="flex-1">
          {expanded ? (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full min-h-[120px] bg-bg-elevated rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary" placeholder="What did you build, ship, or learn today?" autoFocus />
          ) : (
            <button onClick={() => setExpanded(true)} className="w-full h-11 bg-bg-elevated rounded-lg px-4 text-left text-sm text-text-muted hover:bg-bg-overlay transition-colors">What did you build, ship, or learn today?</button>
          )}
        </div>
        {!expanded && (
          <button className="flex items-center gap-1.5 bg-bg-elevated rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-bg-overlay transition-colors">📌 Milestone<ChevronDown className="w-3 h-3" /></button>
        )}
      </div>
      {expanded && (
        <>
          <div className="mt-3 text-xs text-text-muted">Sharing as: <span className="inline-block bg-bg-elevated text-accent-primary px-2 py-0.5 rounded-full ml-1">MVP</span></div>
          {/* Target audience (WS6): empty = Everyone */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Target:</span>
            <button
              onClick={() => setAudience([])}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${audience.length === 0 ? 'border-accent-primary text-accent-primary' : 'border-border-default text-text-secondary hover:border-border-active'}`}
            >
              Everyone
            </button>
            {targetRoles.map((role) => (
              <button
                key={role}
                onClick={() => toggleAudience(role)}
                className={`text-xs px-2 py-1 rounded-full border capitalize transition-colors ${audience.includes(role) ? 'border-accent-primary text-accent-primary' : 'border-border-default text-text-secondary hover:border-border-active'}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs bg-bg-elevated border border-border-default text-text-secondary px-2 py-1 rounded">#healthtech</span>
            <span className="text-xs bg-bg-elevated border border-border-default text-text-secondary px-2 py-1 rounded">#mvp</span>
            <span className="text-xs bg-bg-elevated border border-border-default text-text-secondary px-2 py-1 rounded">#saas</span>
            <button className="text-xs bg-transparent border border-dashed border-border-default text-text-muted px-2 py-1 rounded hover:border-accent-primary hover:text-accent-primary transition-colors">+ Add tag</button>
          </div>
          <div className="mt-4 bg-bg-elevated rounded-lg p-3">
            <div className="flex items-center justify-between mb-1"><span className="text-text-muted text-xs">Post quality</span><span className="font-mono text-xs text-score-amber">72/100</span></div>
            <div className="h-1 bg-bg-base rounded-full overflow-hidden"><div className="h-full bg-score-amber rounded-full" style={{ width: '72%' }}></div></div>
            <p className="text-text-muted text-[11px] italic mt-2">Add specific metrics to increase reach to ~180 founders</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-3">
              <button className="text-text-muted hover:text-text-primary transition-colors"><span className="text-lg">📎</span></button>
              <button className="text-text-muted hover:text-text-primary transition-colors"><span className="text-lg">📷</span></button>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-right">
                <button onClick={() => setExpanded(false)} className="text-text-secondary hover:text-text-primary text-sm mr-3 transition-colors">Cancel</button>
                <button onClick={handlePost} disabled={!body.trim()} className="bg-accent-primary text-text-primary text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">Post to Tribe</button>
                <p className="text-text-muted text-[11px] mt-1">Estimated reach: ~140 founders in healthtech/MVP stage</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
