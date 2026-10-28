import { ChevronDown, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createPost } from "@/lib/messaging/feed";
import { VIEWER_ROLES, normalizeRole } from "@/lib/messaging/roles";
import { kindsForRole, KIND_META, kindColorClass } from "@/lib/messaging/postKinds";
import { useAuth } from "@/contexts/AuthContext";

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
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

  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
    || profile?.username
    || profile?.email
    || "User";

  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const targetRoles = VIEWER_ROLES.filter((role) => role !== "community");

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
      if (!created) throw new Error("Post was not persisted.");
      setBody("");
      setAudience([]);
      setExpanded(false);
      await onCreated?.();
      toast.success("Post published successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Post could not be published.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-4 sm:p-5 backdrop-blur-xl shadow-sm transition-all font-bricolage">
      {expanded && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {postTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                selectedType === type.id
                  ? "bg-[#20C997]/10 border-[#20C997] text-[#20C997]"
                  : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:border-[#20C997]/40"
              }`}
            >
              <type.icon className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              {type.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20C997] text-xs font-black text-slate-950 shadow-md">
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          {expanded ? (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[120px] w-full resize-none rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10 transition-all"
              placeholder="What did you build, ship, or learn today?"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="h-11 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-4 text-left text-xs font-semibold text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              What did you build, ship, or learn today?
            </button>
          )}
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            {KIND_META[selectedType] && (() => { const Icon = KIND_META[selectedType].icon; return <Icon className="h-3.5 w-3.5" aria-hidden="true" />; })()}
            <span className="hidden sm:inline">{KIND_META[selectedType]?.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Target Audience:</span>
            <button
              type="button"
              onClick={() => setAudience([])}
              className={`rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                audience.length === 0
                  ? "bg-[#20C997]/10 border-[#20C997] text-[#20C997]"
                  : "border-black/[0.08] dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
            >
              Everyone
            </button>
            {targetRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleAudience(role)}
                className={`rounded-xl border px-3 py-1 text-xs font-bold capitalize transition-all ${
                  audience.includes(role)
                    ? "bg-[#20C997]/10 border-[#20C997] text-[#20C997]"
                    : "border-black/[0.08] dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { void handlePost(); }}
              disabled={!body.trim() || posting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{posting ? "Publishing..." : "Publish Post"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
