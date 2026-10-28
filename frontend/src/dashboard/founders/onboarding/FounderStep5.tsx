import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useFounderProfile, type OwnershipPhilosophy } from "@/contexts/UserContext";
import { ArrowRight, ArrowLeft, Target, Lightbulb, Shield, Check, Award } from "lucide-react";

const BRAND = {
  blue: "#0066ff",
  lightBlue: "#58a6ff",
  green: "#20c937",
  dark: "#171330",
  white: "#ffffff",
};

const SLIDE_IMAGES = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
];

const PHILOSOPHY_OPTIONS: { v: OwnershipPhilosophy; label: string }[] = [
  { v: "equity-day-one", label: "Collaborators earn equity from day one" },
  { v: "cash-first-equity-later", label: "Cash-first now, equity at seed" },
  { v: "custom", label: "Custom (negotiate per-person)" },
];

export function FounderStep5() {
  const navigate = useNavigate();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [why, setWhy] = useState(founderProfile.whyBuilding);
  const [winning, setWinning] = useState(founderProfile.winningIn3Years);
  const [advantage, setAdvantage] = useState(founderProfile.unfairAdvantage);
  const [philosophy, setPhilosophy] = useState<OwnershipPhilosophy>(founderProfile.ownershipPhilosophy);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Required fields for this step
  const requiredFields = [why.trim(), winning.trim(), advantage.trim()];
  const fieldsFilled = requiredFields.filter(Boolean).length;
  const totalFields = 3;
  const isComplete = fieldsFilled === totalFields;

  const canContinue = why.trim() && winning.trim() && advantage.trim();

  const persist = () => updateFounderProfile({
    whyBuilding: why, winningIn3Years: winning, unfairAdvantage: advantage, ownershipPhilosophy: philosophy,
  });
  const handleNext = () => { persist(); navigate("/founder/onboarding/step-6"); };
  const handleBack = () => { persist(); navigate("/founder/onboarding/step-4"); };
  const handleSaveExit = () => { persist(); navigate("/"); };

  const inputCls =
    "w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-4 pr-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

  const textareaCls =
    "w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)] resize-none";

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-[#171330] p-[10px] font-bricolage">
      <div className="relative w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden border border-white/10">
        {/* Slideshow background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img src={SLIDE_IMAGES[currentSlide]} alt="Background" className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-[#171330]/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171330]/90 via-transparent to-transparent z-0" />

        {/* Glass form */}
        <div className="relative z-10 flex items-center justify-center p-4 md:p-10 min-h-[calc(100vh-20px)]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-[36px] p-8 md:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.75)]"
          >
            <div className="flex justify-end mb-4">
              <button onClick={handleSaveExit} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Save & exit
              </button>
            </div>

            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/15 border border-[#0066ff]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Step 5 of 6</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
                  Mission
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.7)] leading-relaxed">
                  TechIT is built on the belief that founders should ship outcomes, not pitch decks.
                  The collaborators you bring in earn equity, not just a paycheck. Tell us what you're aiming at.
                </p>
              </div>

              {/* Completion ring */}
              <div className="relative w-14 h-14 shrink-0 hidden sm:block">
                <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={isComplete ? BRAND.green : BRAND.blue}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - fieldsFilled / totalFields) }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isComplete ? (
                    <Check className="w-5 h-5 text-[#20c937]" />
                  ) : (
                    <span className="text-[11px] font-black text-white/80">{fieldsFilled}/{totalFields}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Lightbulb className="w-4 h-4 text-white/50" /> Why are you building this?
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  rows={3}
                  placeholder="What problem are you solving and why does it matter to you personally?"
                  className={textareaCls}
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Target className="w-4 h-4 text-white/50" /> What does winning look like in 3 years?
                </label>
                <textarea
                  value={winning}
                  onChange={(e) => setWinning(e.target.value)}
                  rows={3}
                  placeholder="Describe the outcome — market position, revenue, impact, users."
                  className={textareaCls}
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Shield className="w-4 h-4 text-white/50" /> Unfair advantage
                </label>
                <textarea
                  value={advantage}
                  onChange={(e) => setAdvantage(e.target.value)}
                  rows={3}
                  placeholder="What do you have that others don't? Domain expertise, network, proprietary data, distribution…"
                  className={textareaCls}
                />
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Award className="w-4 h-4 text-white/50" /> Ownership philosophy
                </label>
                <div className="flex flex-col gap-3">
                  {PHILOSOPHY_OPTIONS.map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPhilosophy(v)}
                      className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all hover:scale-[1.01] active:scale-95 ${
                        philosophy === v
                          ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_5px_20px_rgba(0,102,255,0.4)]"
                          : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/70 hover:border-[#58a6ff]/60 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white/60 backdrop-blur-sm">
                Verify your GitHub / socials / ID in Settings → Verification after you finish.
                Verified founders see more matches.
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={handleBack}
                className="group px-6 py-3 rounded-2xl text-white/70 hover:text-white font-bold text-sm flex items-center gap-2 transition-all hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canContinue}
                className="group px-8 py-3.5 rounded-2xl bg-[#0066ff] hover:bg-[#171330] text-white font-black text-base flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_10px_30px_rgba(23,19,48,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066ff] disabled:hover:shadow-[0_10px_30px_rgba(0,102,255,0.4)]"
              >
                Continue <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}