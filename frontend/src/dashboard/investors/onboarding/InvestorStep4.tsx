import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useInvestorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Zap, text: "Risk-adjusted deal recommendations & alerts" },
  { icon: Target, text: "Milestone-based tranche verification" },
  { icon: Sparkles, text: "Instant signal matching with co-investors" },
];

const RISK_PROFILES = [
  {
    id: "High Risk Early Ideas",
    title: "High Risk — Pre-Seed & Ideas",
    icon: Zap,
    description: "Back founders with bold, unproven visions before product-market fit. High failure tolerance with asymmetrical upside.",
  },
  {
    id: "Validated Prototypes",
    title: "Moderate Risk — Validated Prototypes",
    icon: Target,
    description: "Startups with functional MVP, active waitlists, pilot customers, and early traction signals.",
  },
  {
    id: "Revenue Startups",
    title: "Lower Risk — Revenue & Growth",
    icon: TrendingUp,
    description: "Established businesses with recurring revenue, strong unit economics, and predictable retention metrics.",
  },
];

export function InvestorStep4() {
  const navigate = useNavigate();
  const { investorProfile, updateInvestorProfile } = useInvestorProfile();

  const [riskAppetite, setRiskAppetite] = useState(
    investorProfile.riskAppetite || "Validated Prototypes"
  );

  const handleNext = () => {
    updateInvestorProfile({ riskAppetite });
    navigate("/investor/onboarding/step-5");
  };

  const handleBack = () => {
    navigate("/investor/onboarding/step-3");
  };

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
        {/* Left panel */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#171330] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Step 4 of 5</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Risk Tolerance & Thesis
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Tune your deal intelligence feed to match your exact risk-return appetite.
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
              <span className="text-[10px] font-black text-[#20C997]">4 / 5</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#20C997] to-emerald-400 w-4/5" />
            </div>
          </div>
        </div>

        {/* Right panel */}
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
                Risk Appetite
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                How early in the startup journey do you like to invest?
              </p>
            </div>

            <div className="space-y-3.5">
              {RISK_PROFILES.map(({ id, title, icon: Icon, description }) => {
                const sel = riskAppetite === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRiskAppetite(id)}
                    className={`relative w-full text-left p-4 rounded-2xl border transition-all ${
                      sel
                        ? "bg-[#20C997]/20 border-[#20C997]/50 shadow-[0_0_15px_rgba(32,201,151,0.25)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${sel ? "bg-[#20C997]/30 text-[#20C997]" : "bg-white/10 text-white/60"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`font-bold text-sm ${sel ? "text-white" : "text-white/80"}`}>
                        {title}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed pl-8">{description}</p>
                    {sel && (
                      <motion.div layoutId="riskRing" className="absolute inset-0 rounded-2xl border-2 border-[#20C997]" />
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
                onClick={handleNext}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#20C997] to-[#128a64] text-slate-950 font-black text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(32,201,151,0.4)]"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
