import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createPost } from '@/lib/messaging/feed';
import { VIEWER_ROLES, normalizeRole } from '@/lib/messaging/roles';
import { kindsForRole, KIND_META, kindColorClass } from '@/lib/messaging/postKinds';
import { useAuth } from '@/contexts/AuthContext';
import { MentionTextarea } from '@/components/messaging/MentionTextarea';

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

export function PostComposer({
  expanded,
  setExpanded,
  selectedType,
  setSelectedType,
  onCreated,
}: {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  onCreated?: () => void | Promise<unknown>;
}) {
  const { profile } = useAuth();
  const viewerRole = normalizeRole(profile?.role);
  const postTypes = kindsForRole(viewerRole).map((kind) => ({
    id: kind,
    label: KIND_META[kind].label,
    icon: KIND_META[kind].icon,
  }));
  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
    || profile?.username
    || profile?.email
    || 'User';

  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const targetRoles = VIEWER_ROLES.filter((role) => role !== 'community');

  const toggleAudience = (role: string) => {
    setAudience((current) => (
      current.includes(role)
        ? current.filter((entry) => entry !== role)
        : [...current, role]
    ));
  };

  const handlePost = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const created = await createPost(
        selectedType,
        body.trim(),
        audience.length ? audience : undefined,
      );
      if (!created) throw new Error('Post was not persisted.');
      if (created.pending) {
        toast.info('Saved offline. This post will publish once the messaging service is reachable.');
      }
      setBody('');
      setAudience([]);
      setExpanded(false);
      await onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Post could not be published.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mb-4 border-y border-border-default bg-surface-primary p-4 sm:rounded-lg sm:border">
      {expanded && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
          {postTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedType === type.id
                  ? `bg-accent-primary/10 ${kindColorClass(type.id)}`
                  : 'border-border-default text-text-secondary hover:border-border-active'
              }`}
            >
              <type.icon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{type.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-semibold text-white">
          {initials(name)}
        </div>
        <div className="flex-1">
          {expanded ? (
            <MentionTextarea
              value={body}
              onChange={setBody}
              className="min-h-[120px] w-full resize-none rounded-lg bg-surface-secondary px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="What did you build, ship, or learn today?"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="h-11 w-full rounded-lg bg-surface-secondary px-4 text-left text-sm text-text-muted transition-colors hover:bg-surface-overlay"
            >
              What did you build, ship, or learn today?
            </button>
          )}
        </div>
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-overlay"
          >
            {KIND_META[selectedType] && (() => { const Icon = KIND_META[selectedType].icon; return <Icon className="h-3.5 w-3.5" aria-hidden="true" />; })()}
            {KIND_META[selectedType]?.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Audience:</span>
            <button
              type="button"
              onClick={() => setAudience([])}
              className={`rounded-full border px-2 py-1 text-xs transition-colors ${
                audience.length === 0
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-border-default text-text-secondary'
              }`}
            >
              Everyone
            </button>
            {targetRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleAudience(role)}
                className={`rounded-full border px-2 py-1 text-xs capitalize transition-colors ${
                  audience.includes(role)
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-border-default text-text-secondary'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { void handlePost(); }}
              disabled={!body.trim() || posting}
              className="rounded-lg bg-accent-primary px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {posting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
