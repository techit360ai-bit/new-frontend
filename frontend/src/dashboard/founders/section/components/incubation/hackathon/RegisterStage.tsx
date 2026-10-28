import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Check, Mail, Send, ArrowLeft, Trophy } from "lucide-react";
import { toast } from "sonner";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import { useFounderProfile, type OpenRole } from "@/contexts/UserContext";
import { fetchFounderOpportunityCatalog } from "@/lib/api/opportunities";
import { registerHackathonTeam } from "@/lib/api/hackathon";

const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += BASE32_ALPHABET[bytes[i] % 32];
  return out;
}

function isHackathon(o: { type: string }): o is Hackathon {
  return o.type === "hackathon";
}

export function RegisterStage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { founderProfile, registerForHackathon } = useFounderProfile();

  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchFounderOpportunityCatalog()
      .then((rows) => {
        if (alive) setAllHackathons(rows.filter(isHackathon));
      })
      .catch((err) => {
        if (!alive) return;
        setAllHackathons([]);
        setLoadError(err instanceof Error ? err.message : "Live hackathons are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);
  const initialHackathonId = searchParams.get("h") ?? "";
  const [hackathonId, setHackathonId] = useState(initialHackathonId);
  const hackathon = allHackathons.find((h) => h.id === hackathonId);

  const [teamName, setTeamName] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [selectedRoles, setSelectedRoles] = useState<OpenRole[]>(founderProfile.openRoles);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    teamId: string;
    inviteToken: string;
    teamName: string;
    hackathonId: string;
  } | null>(null);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading live hackathons...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-600">Live hackathons are unavailable: {loadError}</p>;
  }

  if (!hackathon && !success) {
    return (
      <div className="border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Pick a hackathon to register for.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {allHackathons.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHackathonId(h.id)}
              className="text-left border border-black/[0.08] dark:border-white/10 rounded-xl p-3.5 bg-white dark:bg-[#1a1a1a] hover:border-[#0066ff] dark:hover:border-[#58a6ff] transition-all"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Hackathon</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{h.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{h.theme}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const toggleRole = (role: OpenRole) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (teamName.trim().length < 3) e.teamName = "Team name must be at least 3 characters.";
    if (selectedRoles.length === 0) e.roles = "Select at least one role to fill.";
    if (teamSize < 2 || teamSize > 5) e.teamSize = "Team size must be between 2 and 5.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !hackathon) return;
    const inviteToken = randomToken(8);
    setSubmitting(true);
    try {
      const registration = await registerHackathonTeam(hackathon.id, {
        teamName: teamName.trim(),
        teamSize,
        inviteToken,
        openRoles: selectedRoles,
      });
      if (!registration) {
        toast.error("The team registration was not persisted.");
        return;
      }
      registerForHackathon(registration);
      setSuccess({
        teamId: registration.teamId,
        inviteToken: registration.inviteToken,
        teamName: registration.teamName,
        hackathonId: registration.hackathonId,
      });
      toast.success("Registered for " + hackathon.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The team registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SuccessCard
        teamId={success.teamId}
        inviteToken={success.inviteToken}
        teamName={success.teamName}
        hackathonId={success.hackathonId}
        hackathonTitle={hackathon?.title ?? ""}
        onFindCollaborators={() => navigate(`/matches?hackathon=${success.hackathonId}`)}
      />
    );
  }

  return (
    <div className="border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
          <Trophy className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Register for {hackathon!.title}</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Team name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="BrightBridge"
            className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
          />
          {errors.teamName && <p className="text-xs text-rose-500 mt-1">{errors.teamName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Team size
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTeamSize(n)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  teamSize === n
                    ? "border-[#0066ff] bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]"
                    : "border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errors.teamSize && <p className="text-xs text-rose-500 mt-1">{errors.teamSize}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Roles to fill ({selectedRoles.length} selected)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {founderProfile.openRoles.map((role) => (
              <label key={role} className="flex items-center gap-2.5 text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 cursor-pointer bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded text-[#0066ff] focus:ring-[#0066ff]"
                />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{role}</span>
              </label>
            ))}
          </div>
          {errors.roles && <p className="text-xs text-rose-500 mt-1">{errors.roles}</p>}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-black/[0.06] dark:border-white/10">
          <Link to="/incubation-hub?panel=hackathon" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40"
          >
            {submitting ? "Registering..." : "Confirm & generate invite link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessCard({
  teamId,
  inviteToken,
  teamName,
  hackathonId,
  hackathonTitle,
  onFindCollaborators,
}: {
  teamId: string;
  inviteToken: string;
  teamName: string;
  hackathonId: string;
  hackathonTitle: string;
  onFindCollaborators: () => void;
}) {
  const url = `https://techit.ai/h/${hackathonId}/team/${teamId}?token=${inviteToken}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const mailto = `mailto:?subject=${encodeURIComponent(`Join ${teamName} for ${hackathonTitle}`)}&body=${encodeURIComponent(url)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`Join ${teamName} for ${hackathonTitle}: ${url}`)}`;

  return (
    <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-2xl p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Check className="w-5 h-5 text-emerald-500" />
        <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">You're registered as team leader for {hackathonTitle}</h2>
      </div>
      <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-4">Share this link with collaborators to invite them to {teamName}:</p>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 text-xs border border-emerald-500/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 font-mono truncate outline-none"
          aria-label="Invite link"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-bold px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={mailto} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-[#1a1a1a] hover:bg-emerald-50 dark:hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors">
          <Mail className="w-3.5 h-3.5" />
          Email
        </a>
        <a href={wa} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-[#1a1a1a] hover:bg-emerald-50 dark:hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors">
          <Send className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onFindCollaborators}
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl border border-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] bg-[#0066ff]/10 hover:bg-[#0066ff]/20 transition-all"
        >
          Find Hackathon Collaborator →
        </button>
      </div>
    </div>
  );
}
