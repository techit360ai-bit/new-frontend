import { useEffect, useMemo, useState } from "react";
import { Copy, Linkedin, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveCollaborationInvite,
  type CollaborationAudienceRole,
  type CollaborationInviteDraft,
} from "@/lib/collaborationMatching";
import { broadcastCollaborationCall } from "@/lib/api/opportunities";

export interface IncubationProjectContext {
  id?: string | null;
  workspaceId?: string | null;
  name?: string;
  summary?: string;
  industry?: string;
  stage?: string;
}

const STORY_COOLDOWN_KEY = "techit.validation-story.last-shown";
const STORY_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function clean(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function factualSummary(project: IncubationProjectContext): string {
  const name = clean(project.name) || "This idea";
  const summary = clean(project.summary);
  const context = [clean(project.stage), clean(project.industry)].filter(Boolean).join(" ");
  if (summary && normalized(summary) !== normalized(name)) {
    return `${name}: ${summary}${context ? ` (${context})` : ""}.`;
  }
  if (context) return `${name} is a ${context} project that completed founder validation on TechIT Network.`;
  return `${name} completed founder validation on TechIT Network.`;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function referralUrl(projectId: string): string {
  const prefix = projectId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "validated";
  return `${window.location.origin}/signup?ref=incubation-${prefix}`;
}

function storyMessage(project: IncubationProjectContext, projectId: string): string {
  const name = clean(project.name) || "my idea";
  const industry = clean(project.industry);
  const summary = clean(project.summary);
  const link = referralUrl(projectId);
  const variant = [...projectId].reduce((total, char) => total + char.charCodeAt(0), 0) % 3;
  if (variant === 0) {
    return `I just validated ${name}${industry ? ` in ${industry}` : ""} on TechIT Network. Have an idea? Build it with the right people: ${link}`;
  }
  if (variant === 1) {
    return `I am turning ${name} into a real company on TechIT Network. Join to build an idea or earn ownership by contributing: ${link}`;
  }
  const brief = summary && normalized(summary) !== normalized(name) ? ` - ${summary.slice(0, 90)}` : "";
  return `Building ${name}${brief}. Join TechIT Network to bring ideas to life or gain ownership by helping: ${link}`;
}

export function validationStoryDue(now = Date.now()): boolean {
  if (typeof localStorage === "undefined") return false;
  const lastShown = Number(localStorage.getItem(STORY_COOLDOWN_KEY) || 0);
  return !Number.isFinite(lastShown) || lastShown <= 0 || now - lastShown >= STORY_COOLDOWN_MS;
}

export function markValidationStoryShown(now = Date.now()): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(STORY_COOLDOWN_KEY, String(now));
}

export function CollaboratorInviteDialog({
  open,
  onOpenChange,
  project,
  sessionId,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: IncubationProjectContext;
  sessionId: string;
  onContinue: (draft: CollaborationInviteDraft) => void;
}) {
  const projectId = clean(project.id) || sessionId;
  const projectName = clean(project.name) || "Validated idea";
  const generatedSummary = useMemo(() => factualSummary(project), [project]);
  const [summary, setSummary] = useState(generatedSummary);
  const [requestedRole, setRequestedRole] = useState("");
  const [skills, setSkills] = useState("");
  const [scope, setScope] = useState("");
  const [desiredWeeklyHours, setDesiredWeeklyHours] = useState(10);
  const [earliestStart, setEarliestStart] = useState<CollaborationInviteDraft["earliestStart"]>("this-week");
  const [commitmentStyle, setCommitmentStyle] = useState<CollaborationInviteDraft["commitmentStyle"]>("deep");
  const [compensationMode, setCompensationMode] = useState<CollaborationInviteDraft["compensationMode"]>("equity-heavy");
  const [equityProposal, setEquityProposal] = useState(0);
  const [cashReward, setCashReward] = useState(0);
  const [broadcast, setBroadcast] = useState(false);
  const [audienceRoles, setAudienceRoles] = useState<CollaborationAudienceRole[]>(["collaborator"]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSummary(generatedSummary);
  }, [generatedSummary, open]);

  const continueToMatches = async () => {
    if (!requestedRole.trim() || !scope.trim()) {
      toast.error("Add the collaborator role and work scope first.");
      return;
    }
    if (compensationMode !== "cash-only" && equityProposal <= 0) {
      toast.error("Add the proposed ownership percentage.");
      return;
    }
    if (compensationMode === "equity-cash" && cashReward <= 0) {
      toast.error("Add the optional cash support for the equity plus cash offer.");
      return;
    }
    if (compensationMode === "cash-only" && cashReward <= 0) {
      toast.error("Add the cash offer.");
      return;
    }
    if (broadcast && audienceRoles.length === 0) {
      toast.error("Select at least one Opportunity Hub audience.");
      return;
    }
    const draft: CollaborationInviteDraft = {
      projectId,
      workspaceId: clean(project.workspaceId) || undefined,
      projectName,
      summary: summary.trim().slice(0, 500),
      scope: scope.trim().slice(0, 1000),
      requestedRole: requestedRole.trim().slice(0, 80),
      requiredSkills: skills.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 12),
      desiredWeeklyHours: Math.min(80, Math.max(1, Number(desiredWeeklyHours) || 10)),
      earliestStart,
      commitmentStyle,
      compensationMode,
      equityProposal: compensationMode === "cash-only" ? 0 : Math.min(30, Math.max(0, Number(equityProposal) || 0)),
      cashReward: compensationMode === "equity-heavy" ? 0 : Math.min(1_000_000, Math.max(0, Number(cashReward) || 0)),
      industry: clean(project.industry) || undefined,
      stage: clean(project.stage) || undefined,
      audienceRoles: broadcast ? audienceRoles : undefined,
    };
    setSubmitting(true);
    try {
      if (broadcast) {
        await broadcastCollaborationCall(draft, audienceRoles);
        toast.success("Collaboration call published to the selected Opportunity Hubs.");
      }
      saveCollaborationInvite(draft);
      onContinue(draft);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The collaboration call could not be published.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAudience = (role: CollaborationAudienceRole) => {
    setAudienceRoles((current) => current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role]);
  };

  const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-600" /> Find the right collaborators</DialogTitle>
          <DialogDescription>Your validated inputs create the factual project brief below. Compensation remains a proposal until both sides agree.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs font-semibold text-slate-700">
            Project summary
            <textarea value={summary} onChange={(event) => setSummary(event.target.value.slice(0, 500))} rows={3} className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Collaborator role
            <input value={requestedRole} onChange={(event) => setRequestedRole(event.target.value)} placeholder="Backend Engineer" className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Required skills, comma separated
            <input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Node.js, Postgres, APIs" className={inputClass} />
          </label>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-700">
            Work scope
            <textarea value={scope} onChange={(event) => setScope(event.target.value.slice(0, 1000))} rows={3} placeholder="What should this collaborator own and deliver?" className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Expected hours per week
            <input type="number" min={1} max={80} value={desiredWeeklyHours} onChange={(event) => setDesiredWeeklyHours(Number(event.target.value))} className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Preferred start
            <select value={earliestStart} onChange={(event) => setEarliestStart(event.target.value as CollaborationInviteDraft["earliestStart"])} className={inputClass}>
              <option value="this-week">This week</option>
              <option value="2-weeks">Within 2 weeks</option>
              <option value="1-month">Within 1 month</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Working style
            <select value={commitmentStyle} onChange={(event) => setCommitmentStyle(event.target.value as CollaborationInviteDraft["commitmentStyle"])} className={inputClass}>
              <option value="deep">Deep focus on one project</option>
              <option value="parallel">A few parallel projects</option>
              <option value="many">Flexible across many projects</option>
            </select>
          </label>
          <div />
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-700">Ownership offer</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {([
                ["equity-heavy", "Equity heavy", "Ownership-first"],
                ["equity-cash", "Equity + cash", "Ownership with support"],
                ["cash-only", "Cash only", "Use by exception"],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompensationMode(value)}
                  className={`border px-3 py-2 text-left ${compensationMode === value ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <span className="block text-xs font-semibold">{label}</span>
                  <span className="block text-[11px]">{description}</span>
                </button>
              ))}
            </div>
          </div>
          {compensationMode !== "cash-only" && (
            <label className="text-xs font-semibold text-slate-700">
              Proposed ownership (%)
              <input type="number" min={0} max={30} step={0.5} value={equityProposal} onChange={(event) => setEquityProposal(Number(event.target.value))} className={inputClass} />
            </label>
          )}
          {compensationMode !== "equity-heavy" && (
            <label className="text-xs font-semibold text-slate-600">
              Optional cash support per month (USD)
              <input type="number" min={0} max={1_000_000} step={50} value={cashReward} onChange={(event) => setCashReward(Number(event.target.value))} className={inputClass} />
            </label>
          )}
          <div className="sm:col-span-2 rounded-md border border-indigo-200 bg-indigo-50 p-3">
            <label className="flex items-start gap-2 text-sm font-semibold text-indigo-950">
              <input type="checkbox" checked={broadcast} onChange={(event) => setBroadcast(event.target.checked)} className="mt-0.5" />
              Broadcast this collaboration call in Opportunity Hubs
            </label>
            {broadcast && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-indigo-900">
                <label className="flex items-center gap-2"><input type="checkbox" checked={audienceRoles.includes("collaborator")} onChange={() => toggleAudience("collaborator")} /> Collaborators</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={audienceRoles.includes("founder")} onChange={() => toggleAudience("founder")} /> Founders</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={audienceRoles.includes("explorer")} onChange={() => toggleAudience("explorer")} /> Future explorers</label>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500">Ownership is the primary offer. All figures are non-binding proposals subject to scope, milestones, vesting and mutual agreement.</p>
        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Not now</button>
          <button type="button" disabled={submitting} onClick={() => void continueToMatches()} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">{submitting ? "Publishing..." : "Match real profiles"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ValidationStoryDialog({
  open,
  onOpenChange,
  project,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: IncubationProjectContext;
  sessionId: string;
}) {
  const projectId = clean(project.id) || sessionId;
  const message = useMemo(() => storyMessage(project, projectId), [project, projectId]);

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Story and invite link copied.");
  };
  const nativeShare = async () => {
    if (!navigator.share) return copy();
    await navigator.share({ title: `${clean(project.name) || "My idea"} on TechIT Network`, text: message });
  };
  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-emerald-600" /> Share your build story</DialogTitle>
          <DialogDescription>A short progress update can strengthen your public credibility and invite relevant builders.</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{message}</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => void copy()} className="flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"><Copy className="h-4 w-4" /> Copy</button>
          <button type="button" onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`)} className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Share2 className="h-4 w-4" /> Share on X</button>
          <button type="button" onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl(projectId))}`)} className="flex items-center justify-center gap-2 rounded-md bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white"><Linkedin className="h-4 w-4" /> LinkedIn</button>
        </div>
        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Maybe later</button>
          <button type="button" onClick={() => void nativeShare()} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Share story</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
