import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFounderProfile, type FounderExperience } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { User, MapPin, Briefcase, Calendar, MessageSquare } from "lucide-react";

const FOUNDER_TYPES: { v: FounderExperience; label: string }[] = [
  { v: "first-time",       label: "First time" },
  { v: "some-experience",  label: "Some experience" },
  { v: "serial",           label: "Serial" },
];

export function FounderStep1() {
  const navigate = useNavigate();
  const { updateProfile, activateRole } = useAuth();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [name, setName]         = useState(founderProfile.name);
  const [title, setTitle]       = useState(founderProfile.title);
  const [location, setLocation] = useState(founderProfile.location);
  const [years, setYears]       = useState(founderProfile.yearsBuilding);
  const [type, setType]         = useState<FounderExperience>(founderProfile.founderType);
  const [headline, setHeadline] = useState(founderProfile.headline);
  const [finishing, setFinishing] = useState(false);

  const canContinue = name.trim() && title.trim() && location.trim() && years >= 0 && headline.trim();

  const persist = () => updateFounderProfile({ name, title, location, yearsBuilding: years, founderType: type, headline });
  const handleFinish = async () => {
    persist();
    setFinishing(true);
    const activated = await activateRole("founder", { name, title, location, yearsBuilding: years, founderType: type, headline });
    if (activated.error) { setFinishing(false); return; }
    // Onboarded now; the rest of the profile is completed later (banner prompts them).
    const { error } = await updateProfile({ isOnboarded: true, title, country: location, yearsBuilding: years, founderType: type, bio: headline });
    if (error) { setFinishing(false); return; }
    localStorage.setItem("techit_profile_completion_pending", "founder");
    navigate(roleDashboardPath.founder, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Tell us who you are</h1>
          <p className="text-base text-text-muted">Just the basics to get you in. You can complete the rest of your profile any time from your dashboard.</p>
        </div>

        <div className="space-y-5">
          <Field label="Full name" icon={User}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chen"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors" />
          </Field>
          <Field label="Professional title" icon={Briefcase}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Founder & CEO"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors" />
          </Field>
          <Field label="Location" icon={MapPin}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors" />
          </Field>
          <Field label="Years building" icon={Calendar}>
            <input type="number" min={0} max={60} value={years} onChange={(e) => setYears(Number(e.target.value) || 0)}
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors tabular-nums" />
          </Field>

          <div>
            <label className="block mb-3 text-sm font-semibold text-text-secondary">Founder type</label>
            <div className="grid grid-cols-3 gap-3">
              {FOUNDER_TYPES.map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setType(v)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    type === v
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-border-strong bg-surface-primary text-text-secondary hover:border-violet-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Headline (one line)" icon={MessageSquare}>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120}
              placeholder="Building the operating system for African fintech."
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-violet-500 transition-colors" />
          </Field>
        </div>

        <div className="flex justify-end mt-10">
          <button onClick={handleFinish} disabled={!canContinue || finishing}
            className="px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:bg-slate-200 disabled:text-text-disabled disabled:cursor-not-allowed transition-colors">
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
