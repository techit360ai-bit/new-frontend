import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { User, MapPin, Briefcase, Calendar, MessageSquare } from "lucide-react";

export function CollabStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [name, setName]             = useState(collaboratorProfile.name);
  const [title, setTitle]           = useState(collaboratorProfile.title);
  const [location, setLocation]     = useState(collaboratorProfile.location);
  const [years, setYears]           = useState(collaboratorProfile.yearsExperience);
  const [headline, setHeadline]     = useState(collaboratorProfile.headline);
  const [finishing, setFinishing] = useState(false);

  const canContinue = name.trim() && title.trim() && location.trim() && years >= 0 && headline.trim();

  const handleNext = async () => {
    updateCollaboratorProfile({ name, title, location, yearsExperience: years, headline });
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) { setFinishing(false); return; }
    localStorage.setItem("techit_profile_completion_pending", "collaborator");
    navigate(roleDashboardPath.collaborator, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Tell us who you are</h1>
          <p className="text-base text-text-muted">The basics. We'll use this on your public profile and to match you with the right builds.</p>
        </div>

        <div className="space-y-5">
          <Field label="Full name" icon={User}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chen"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </Field>
          <Field label="Professional title" icon={Briefcase}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Frontend Engineer"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </Field>
          <Field label="Location" icon={MapPin}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </Field>
          <Field label="Years of experience" icon={Calendar}>
            <input type="number" min={0} max={60} value={years} onChange={(e) => setYears(Number(e.target.value) || 0)}
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors tabular-nums" />
          </Field>
          <Field label="Headline (one line)" icon={MessageSquare}>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120}
              placeholder="I ship product-grade React systems quickly."
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </Field>
        </div>

        <div className="flex justify-end mt-10">
          <button onClick={handleNext} disabled={!canContinue || finishing}
            className="px-6 py-3 rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400 disabled:bg-slate-200 disabled:text-text-disabled disabled:cursor-not-allowed transition-colors">
            {finishing ? "Setting up…" : "Finish & go to dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-text-secondary">
        <Icon className="w-4 h-4 text-text-disabled" /> {label}
      </label>
      {children}
    </div>
  );
}
