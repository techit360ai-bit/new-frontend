import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgProfile, type OrgTeamMember } from "@/contexts/UserContext";
import { OrgProgressBar } from "./OrgProgressBar";
import { Users, Plus, X, Crown } from "lucide-react";

export function OrgStep4() {
  const navigate = useNavigate();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [members, setMembers] = useState<OrgTeamMember[]>(
    orgProfile.teamMembers,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Programme Manager");

  const addMember = () => {
    if (!name.trim() || !email.trim()) return;
    const m: OrgTeamMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    };
    setMembers([...members, m]);
    setName("");
    setEmail("");
    setRole("Programme Manager");
  };

  const removeMember = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleNext = () => {
    updateOrgProfile({ teamMembers: members });
    navigate("/org/onboarding/step-5");
  };
  const handleBack = () => navigate("/org/onboarding/step-3");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <OrgProgressBar currentStep={4} totalSteps={5} />

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2 flex items-center gap-3">
            <Users className="w-9 h-9 text-brand-accent" />
            Team & Contacts
          </h1>
          <p className="text-base text-text-muted dark:text-text-disabled">
            Add the people who will run programmes and review applications.
          </p>
        </div>

        {/* Add member form */}
        <div className="bg-surface-primary dark:bg-surface-inverse-muted/60 border-2 border-border-default dark:border-border-inverse-strong rounded-2xl p-6 mb-8">
          <h3 className="text-base font-bold text-text-primary dark:text-white mb-4">
            Add a team member
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="h-12 bg-background-primary dark:bg-background-inverse/60 border-2 border-border-default dark:border-border-inverse-strong rounded-lg px-4 text-sm text-text-primary dark:text-white outline-none focus:border-brand-accent transition-colors"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="work@email.com"
              className="h-12 bg-background-primary dark:bg-background-inverse/60 border-2 border-border-default dark:border-border-inverse-strong rounded-lg px-4 text-sm text-text-primary dark:text-white outline-none focus:border-brand-accent transition-colors"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-12 bg-background-primary dark:bg-background-inverse/60 border-2 border-border-default dark:border-border-inverse-strong rounded-lg px-4 text-sm text-text-primary dark:text-white outline-none focus:border-brand-accent transition-colors"
            >
              <option>Programme Manager</option>
              <option>Admin</option>
              <option>Mentor Lead</option>
              <option>Partnerships</option>
              <option>Finance</option>
              <option>Marketing</option>
            </select>
          </div>
          <button
            onClick={addMember}
            disabled={!name.trim() || !email.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-accent hover:bg-brand-accent disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add member
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2.5">
          {members.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border-strong dark:border-border-inverse-strong rounded-xl">
              <p className="text-sm text-text-muted dark:text-text-disabled">
                No team members yet — you can add them later from Settings.
              </p>
            </div>
          ) : (
            members.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center gap-4 bg-surface-primary dark:bg-surface-inverse-muted/60 border border-border-default dark:border-border-inverse-strong rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-accent to-violet-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary dark:text-white">
                      {m.name}
                    </p>
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-warning dark:bg-status-warning/10 text-status-warning dark:text-status-warning text-[10px] font-mono uppercase tracking-wider">
                        <Crown className="w-3 h-3" />
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted dark:text-text-disabled">
                    {m.email} · {m.role}
                  </p>
                </div>
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-text-disabled hover:text-status-error transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 flex justify-between gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-4 rounded-xl border-2 border-border-strong dark:border-border-inverse-strong text-text-secondary dark:text-text-on-inverse-secondary font-semibold hover:border-brand-accent transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:from-brand-accent hover:to-violet-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
