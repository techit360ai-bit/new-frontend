import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useFounderProfile, type FounderStage } from "@/contexts/UserContext";
import { ArrowRight, ArrowLeft, Building2, Sparkles, Rocket, Repeat, Check, Calendar, Globe, Smile } from "lucide-react";

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

const STAGES: FounderStage[] = ["Idea", "MVP", "Beta", "Launch", "Growth"];
const INDUSTRIES = ["AI/ML", "SaaS", "FinTech", "HealthTech", "E-Commerce", "Edtech", "CleanTech", "Web3"];

export function FounderStep2() {
  const navigate = useNavigate();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [startupName, setStartupName] = useState(founderProfile.startupName);
  const [oneLiner, setOneLiner] = useState(founderProfile.oneLiner);
  const [stage, setStage] = useState<FounderStage>(founderProfile.stage);
  const [industries, setIndustries] = useState<string[]>(founderProfile.industries);
  const [foundingYear, setFoundingYear] = useState(founderProfile.foundingYear);
  const [website, setWebsite] = useState(founderProfile.website);
  const [logoEmoji, setLogoEmoji] = useState(founderProfile.logoEmoji);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleIndustry = (s: string) =>
    setIndustries((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < 3 ? [...cur, s] : cur);

  // Required fields for this step
  const requiredFields = [startupName.trim(), oneLiner.trim(), industries.length >= 1];
  const fieldsFilled = requiredFields.filter(Boolean).length;
  const totalFields = 3;
  const isComplete = fieldsFilled === totalFields;

  const canContinue = startupName.trim() && oneLiner.trim() && industries.length >= 1 && industries.length <= 3;

  const persist = () => updateFounderProfile({ startupName, oneLiner, stage, industries, foundingYear, website, logoEmoji });
  const handleNext = () => { persist(); navigate("/founder/onboarding/step-3"); };
  const handleBack = () => { persist(); navigate("/founder/onboarding/step-1"); };
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Step 2 of 6</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
                  Tell us about your startup
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                  Give us the snapshot. This is what collaborators and investors will see first.
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
                  <Building2 className="w-4 h-4 text-white/50" /> Startup name
                </label>
                <input
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="Acme Inc."
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                    <Sparkles className="w-4 h-4 text-white/50" /> One‑liner
                  </label>
                  <span className="text-[10px] font-bold text-white/40">{oneLiner.length}/140</span>
                </div>
                <input
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  maxLength={140}
                  placeholder="We help African SMEs access working capital in under 24 hours."
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Rocket className="w-4 h-4 text-white/50" /> Stage
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className={`px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${
                        stage === s
                          ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_5px_20px_rgba(0,102,255,0.4)]"
                          : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/70 hover:border-[#58a6ff]/60 hover:bg-white/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Repeat className="w-4 h-4 text-white/50" /> Industries <span className="font-normal text-white/40">({industries.length} of 1–3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => toggleIndustry(ind)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 ${
                        industries.includes(ind)
                          ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_4px_12px_rgba(0,102,255,0.3)]"
                          : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/60 hover:border-[#58a6ff]/60 hover:bg-white/10"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Calendar className="w-4 h-4 text-white/50" /> Founding year
                </label>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  value={foundingYear}
                  onChange={(e) => setFoundingYear(Number(e.target.value) || new Date().getFullYear())}
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Globe className="w-4 h-4 text-white/50" /> Website <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourstartup.com"
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Smile className="w-4 h-4 text-white/50" /> Logo symbol <span className="font-normal text-white/40">(optional, max 4 chars)</span>
                </label>
                <input
                  value={logoEmoji}
                  onChange={(e) => setLogoEmoji(e.target.value)}
                  maxLength={4}
                  placeholder="TI"
                  className={`${inputCls} w-32 text-2xl`}
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