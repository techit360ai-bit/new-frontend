import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useFounderProfile, type LaunchStatus } from "@/contexts/UserContext";
import { ArrowRight, ArrowLeft, Rocket, Users, DollarSign, TrendingUp, Target, Check } from "lucide-react";

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

const LAUNCH_OPTIONS: { v: LaunchStatus; label: string }[] = [
  { v: "pre-launch", label: "Pre‑launch" },
  { v: "private-beta", label: "Private beta" },
  { v: "public", label: "Public" },
];

export function FounderStep4() {
  const navigate = useNavigate();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [launch, setLaunch] = useState<LaunchStatus>(founderProfile.launchStatus);
  const [users, setUsers] = useState(founderProfile.users);
  const [revenue, setRevenue] = useState(founderProfile.revenueMonthly);
  const [funding, setFunding] = useState(founderProfile.fundingRaised);
  const [investor, setInvestor] = useState(founderProfile.leadInvestor);
  const [milestone, setMilestone] = useState(founderProfile.nextMilestone);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Required fields for this step
  const requiredFields = [milestone.trim().length > 0];
  const fieldsFilled = requiredFields.filter(Boolean).length;
  const totalFields = 1;
  const isComplete = fieldsFilled === totalFields;

  const canContinue = milestone.trim().length > 0;

  const persist = () => updateFounderProfile({
    launchStatus: launch, users, revenueMonthly: revenue, fundingRaised: funding,
    leadInvestor: investor, nextMilestone: milestone,
  });
  const handleNext = () => { persist(); navigate("/founder/onboarding/step-5"); };
  const handleBack = () => { persist(); navigate("/founder/onboarding/step-3"); };
  const handleSaveExit = () => { persist(); navigate("/"); };

  const inputCls =
    "w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-4 pr-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

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
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Step 4 of 6</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
                  Where you are right now
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                  Be honest. Zero is fine.
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
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Rocket className="w-4 h-4 text-white/50" /> Have you launched?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {LAUNCH_OPTIONS.map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLaunch(v)}
                      className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${
                        launch === v
                          ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_5px_20px_rgba(0,102,255,0.4)]"
                          : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/70 hover:border-[#58a6ff]/60 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Users className="w-4 h-4 text-white/50" /> Users / customers
                </label>
                <input
                  type="number"
                  min={0}
                  value={users}
                  onChange={(e) => setUsers(Math.max(0, Number(e.target.value) || 0))}
                  className={inputCls}
                  placeholder="e.g. 1500"
                />
                <p className="mt-1 text-[10px] text-white/30 font-medium">Active accounts, MAU, whatever you track</p>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <DollarSign className="w-4 h-4 text-white/50" /> Revenue (monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-base">$</span>
                  <input
                    type="number"
                    min={0}
                    value={revenue}
                    onChange={(e) => setRevenue(Math.max(0, Number(e.target.value) || 0))}
                    className={`${inputCls} pl-8`}
                    placeholder="0"
                  />
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <TrendingUp className="w-4 h-4 text-white/50" /> Funding raised <span className="font-normal text-white/40">(pre‑seed / seed total)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-base">$</span>
                  <input
                    type="number"
                    min={0}
                    value={funding}
                    onChange={(e) => setFunding(Math.max(0, Number(e.target.value) || 0))}
                    className={`${inputCls} pl-8`}
                    placeholder="0"
                  />
                </div>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Users className="w-4 h-4 text-white/50" /> Lead investor <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  placeholder="Y Combinator, Sequoia, angel name…"
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                    <Target className="w-4 h-4 text-white/50" /> Key milestone next
                  </label>
                  <span className="text-[10px] font-bold text-white/40">{milestone.length}/120</span>
                </div>
                <input
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  maxLength={120}
                  placeholder="Launch public beta with 500 waitlist users by end of Q3."
                  className={inputCls}
                />
              </motion.div>
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