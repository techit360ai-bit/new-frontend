import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgProfile, type OrgPlan } from "@/contexts/UserContext";
import { persistOnboardingCompletion } from "@/lib/onboarding";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { OrgProgressBar } from "./OrgProgressBar";
import { CheckCircle2, Sparkles, Rocket, Building2 } from "lucide-react";

const plans: {
  id: OrgPlan;
  name: string;
  blurb: string;
  price: string;
  features: string[];
  icon: typeof Sparkles;
  accent: string;
}[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Test the platform with one programme",
    price: "$0/mo",
    features: ["1 active programme", "Up to 50 builders", "Basic analytics"],
    icon: Sparkles,
    accent: "border-border-strong dark:border-border-inverse-strong",
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Run accelerators, hackathons and grants",
    price: "$499/mo",
    features: [
      "Unlimited programmes",
      "Up to 1,000 builders",
      "Hackathon command centre",
      "Sponsor reporting",
      "Talent pool search",
    ],
    icon: Rocket,
    accent: "border-brand-accent",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "For multi-region partners and corporates",
    price: "Custom",
    features: [
      "Everything in Growth",
      "Dedicated success manager",
      "Custom integrations & SSO",
      "Cohort trajectory tracking",
      "White-label option",
    ],
    icon: Building2,
    accent: "border-violet-500",
  },
];

export function OrgStep5() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [plan, setPlan] = useState<OrgPlan>(orgProfile.plan);
  const [finishing, setFinishing] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (finishing) return;
    updateOrgProfile({ plan });
    setFinishing(true);
    setCompletionError(null);
    try {
      await persistOnboardingCompletion(updateProfile);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "Profile update failed.");
      setFinishing(false);
      return;
    }
    navigate(roleDashboardPath.org, { replace: true });
  };
  const handleBack = () => navigate("/org/onboarding/step-4");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <OrgProgressBar currentStep={5} totalSteps={5} />

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">
            Choose your plan
          </h1>
          <p className="text-base text-text-muted dark:text-text-disabled">
            You can change this any time from Billing &amp; Usage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {plans.map((p) => {
            const active = plan === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`text-left p-6 rounded-2xl border-2 transition-all ${
                  active
                    ? `${p.accent} bg-surface-primary dark:bg-surface-inverse-muted/60 shadow-xl ring-2 ring-indigo-500/20`
                    : "border-border-default dark:border-border-inverse-strong bg-surface-primary/60 dark:bg-surface-inverse-muted/40 hover:border-brand-accent"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${active ? "bg-status-info-soft dark:bg-status-info-soft/20 text-brand-accent dark:text-brand-accent" : "bg-surface-secondary dark:bg-slate-700/50 text-text-muted"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {active && (
                    <CheckCircle2 className="w-5 h-5 text-brand-accent" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-1">
                  {p.name}
                </h3>
                <p className="text-xs text-text-muted dark:text-text-disabled mb-3">
                  {p.blurb}
                </p>
                <p className="text-2xl font-bold text-text-primary dark:text-white mb-4">
                  {p.price}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-text-secondary dark:text-text-on-inverse-secondary"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? "text-brand-accent" : "text-text-disabled"}`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-4 rounded-xl border-2 border-border-strong dark:border-border-inverse-strong text-text-secondary dark:text-text-on-inverse-secondary font-semibold hover:border-brand-accent transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => void handleComplete()}
            disabled={finishing}
            className="px-12 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:from-brand-accent hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {finishing ? "Completing..." : "Complete setup"}
          </button>
        </div>
        {completionError && (
          <p role="alert" className="mt-3 text-right text-sm text-status-error dark:text-status-error">
            {completionError}
          </p>
        )}
      </div>
    </div>
  );
}
