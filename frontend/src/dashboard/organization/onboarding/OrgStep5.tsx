import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgProfile, type OrgPlan } from "@/contexts/UserContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  Sparkles,
  Rocket,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Sparkles, text: "Instant launch into the TechIT partner ecosystem" },
  { icon: Rocket, text: "Unlimited hackathons and cohorts on Growth plans" },
  { icon: Building2, text: "Dedicated onboarding and enterprise API support" },
];

const PLANS: {
  id: OrgPlan;
  name: string;
  blurb: string;
  price: string;
  features: string[];
  icon: typeof Sparkles;
}[] = [
  {
    id: "free",
    name: "Starter Hub",
    blurb: "Test the platform with 1 active cohort",
    price: "Free",
    features: ["1 active programme / hackathon", "Up to 50 builders", "Standard judge tooling"],
    icon: Sparkles,
  },
  {
    id: "growth",
    name: "Growth Network",
    blurb: "Run accelerators, hackathons & grants",
    price: "$499/mo",
    features: [
      "Unlimited programmes & cohorts",
      "Up to 1,000 builder seats",
      "Hackathon command centre",
      "Sponsor reporting & export",
    ],
    icon: Rocket,
  },
  {
    id: "enterprise",
    name: "Ecosystem Partner",
    blurb: "For universities, governments & funds",
    price: "Custom",
    features: [
      "Everything in Growth",
      "Dedicated success manager",
      "Custom integrations & SSO",
      "Cohort trajectory tracking",
    ],
    icon: Building2,
  },
];

export function OrgStep5() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { orgProfile, updateOrgProfile } = useOrgProfile();

  const [selectedPlan, setSelectedPlan] = useState<OrgPlan>(orgProfile.plan || "growth");
  const [finishing, setFinishing] = useState(false);

  const handleComplete = async () => {
    if (finishing) return;
    setFinishing(true);
    updateOrgProfile({ plan: selectedPlan });
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) {
      setFinishing(false);
      return;
    }
    localStorage.setItem("techit_profile_completion_pending", "organisation");
    navigate(roleDashboardPath.org, { replace: true });
  };

  const handleBack = () => navigate("/org/onboarding/step-4");

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.1 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-[#171330] p-[10px] font-bricolage">
      <div className="w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden grid lg:grid-cols-[42%_58%] border border-white/10">
        {/* Left: brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#171330] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Step 5 of 5</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Select Your Tier
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Choose an organisation plan that fits your program scale. You can change or upgrade anytime.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {PERKS.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#20C997]" />
                </div>
                <span className="text-white/75 text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step progress</span>
              <span className="text-[10px] font-black text-[#20C997]">5 / 5 — Final Step</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#20C997] to-emerald-400 w-full" />
            </div>
          </div>
        </div>

        {/* Right: form panel */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <ImageSlideshow images={SLIDE_IMAGES} />
          </div>

          <div className="absolute inset-0 bg-[#171330]/50 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171330]/40 via-transparent to-[#171330]/60 z-[1]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[85vh] hide-scrollbar"
          >
            <div className="mb-6">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Organisation Tier
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Choose the plan that suits your capacity.
              </p>
            </div>

            <div className="space-y-3">
              {PLANS.map(({ id, name, blurb, price, features, icon: Icon }) => {
                const sel = selectedPlan === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedPlan(id)}
                    className={`relative w-full text-left p-4 rounded-2xl border transition-all ${
                      sel
                        ? "bg-[#20C997]/20 border-[#20C997]/50 shadow-[0_0_15px_rgba(32,201,151,0.25)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${sel ? "text-[#20C997]" : "text-white/40"}`} />
                        <span className={`font-bold text-sm ${sel ? "text-white" : "text-white/80"}`}>
                          {name}
                        </span>
                      </div>
                      <span className={`text-xs font-black ${sel ? "text-[#20C997]" : "text-white/60"}`}>
                        {price}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mb-2.5">{blurb}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-white/70">
                      {features.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-[#20C997] shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>

                    {sel && (
                      <motion.div layoutId="planRing" className="absolute inset-0 rounded-2xl border-2 border-[#20C997]" />
                    )}
                  </button>
                );
              })}
            </div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="h-12 px-5 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-sm uppercase tracking-widest transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={finishing}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#20C997] to-[#128a64] text-slate-950 font-black text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(32,201,151,0.4)] disabled:opacity-50"
              >
                {finishing ? "Completing setup..." : (
                  <>Complete & Enter Hub <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
