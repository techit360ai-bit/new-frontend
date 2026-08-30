import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgProfile } from "@/contexts/UserContext";
import { OrgProgressBar } from "./OrgProgressBar";
import { Target, MapPin, Trophy, Rocket, HandCoins, Compass, UserSearch, Handshake } from "lucide-react";

const PROGRAMMES = [
  { id: "Hackathons", icon: Trophy, desc: "Theme-driven build sprints" },
  { id: "Accelerator", icon: Rocket, desc: "Structured 8–16 week cohorts" },
  { id: "Grants", icon: HandCoins, desc: "Funding for early-stage projects" },
  { id: "Mentorship", icon: Compass, desc: "1-on-1 founder support" },
  { id: "Hiring", icon: UserSearch, desc: "Recruit verified builders" },
  { id: "Sponsorship", icon: Handshake, desc: "Back third-party events" },
];

const SECTORS = [
  "AI",
  "FinTech",
  "Healthcare",
  "Climate",
  "Education",
  "Logistics",
  "Deep Tech",
  "Web3",
  "Agriculture",
  "Energy",
];

const GEOGRAPHIES = [
  "West Africa",
  "East Africa",
  "Southern Africa",
  "North Africa",
  "Middle East",
  "South Asia",
  "South-East Asia",
  "Latin America",
  "Europe",
  "North America",
];

export function OrgStep3() {
  const navigate = useNavigate();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [programmes, setProgrammes] = useState<string[]>(orgProfile.programmes);
  const [sectors, setSectors] = useState<string[]>(orgProfile.sectors);
  const [geographies, setGeographies] = useState<string[]>(
    orgProfile.geographies,
  );

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    val: string,
  ) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const handleNext = () => {
    updateOrgProfile({ programmes, sectors, geographies });
    navigate("/org/onboarding/step-4");
  };
  const handleBack = () => navigate("/org/onboarding/step-2");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <OrgProgressBar currentStep={3} totalSteps={5} />

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">
            Programmes & Focus
          </h1>
          <p className="text-base text-text-muted dark:text-text-disabled">
            What does your organisation offer, and where do you operate? We use
            this to route the right builders to you.
          </p>
        </div>

        <div className="space-y-9">
          {/* Programmes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-brand-accent" />
              <h3 className="text-text-primary dark:text-white font-semibold">
                What you run
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROGRAMMES.map((p) => {
                const active = programmes.includes(p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(programmes, setProgrammes, p.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      active
                        ? "border-brand-accent bg-status-info-soft dark:bg-status-info-soft/10"
                        : "border-border-strong dark:border-border-inverse-strong bg-surface-primary dark:bg-surface-inverse-muted/40 hover:border-brand-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Icon className="h-5 w-5 text-brand-accent dark:text-brand-accent" aria-hidden="true" />
                      <p className="font-bold text-text-primary dark:text-white">
                        {p.id}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-disabled">
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sectors */}
          <div>
            <h3 className="text-text-primary dark:text-white font-semibold mb-4">
              Sectors of focus
            </h3>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => {
                const active = sectors.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(sectors, setSectors, s)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      active
                        ? "bg-brand-accent text-white shadow-md"
                        : "bg-surface-primary dark:bg-surface-inverse-muted/40 text-text-secondary dark:text-text-on-inverse-secondary border-2 border-border-strong dark:border-border-inverse-strong hover:border-brand-accent"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geographies */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-accent" />
              <h3 className="text-text-primary dark:text-white font-semibold">
                Where you operate
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {GEOGRAPHIES.map((g) => {
                const active = geographies.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggle(geographies, setGeographies, g)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      active
                        ? "bg-violet-600 text-white shadow-md"
                        : "bg-surface-primary dark:bg-surface-inverse-muted/40 text-text-secondary dark:text-text-on-inverse-secondary border-2 border-border-strong dark:border-border-inverse-strong hover:border-violet-400"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
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
            disabled={programmes.length === 0 || sectors.length === 0}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:from-brand-accent hover:to-violet-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
