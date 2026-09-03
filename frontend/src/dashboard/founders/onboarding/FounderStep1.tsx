import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useFounderProfile, type FounderExperience } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Rocket,
  Repeat,
  Check,
} from "lucide-react";

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

const FOUNDER_TYPES: { v: FounderExperience; label: string; icon: typeof User; hint: string }[] = [
  { v: "first-time", label: "First time", icon: Sparkles, hint: "New to founding" },
  { v: "some-experience", label: "Some experience", icon: Rocket, hint: "1–2 ventures" },
  { v: "serial", label: "Serial", icon: Repeat, hint: "3+ ventures" },
];

export function FounderStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [name, setName] = useState(founderProfile.name);
  const [title, setTitle] = useState(founderProfile.title);
  const [location, setLocation] = useState(founderProfile.location);
  const [years, setYears] = useState(founderProfile.yearsBuilding);
  const [type, setType] = useState<FounderExperience>(founderProfile.founderType);
  const [headline, setHeadline] = useState(founderProfile.headline);
  const [finishing, setFinishing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const canContinue = name.trim() && title.trim() && location.trim() && years >= 0 && headline.trim();
  const fieldsFilled = [name.trim(), title.trim(), location.trim(), headline.trim()].filter(Boolean).length;
  const totalFields = 4;
  const isComplete = fieldsFilled === totalFields;

  const persist = () => updateFounderProfile({ name, title, location, yearsBuilding: years, founderType: type, headline });

  const handleFinish = async () => {
    persist();
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) {
      setFinishing(false);
      return;
    }
    localStorage.setItem("techit_profile_completion_pending", "founder");
    navigate(roleDashboardPath.founder, { replace: true });
  };

  const inputCls =
    "w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

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
      {/* Outer premium card frame */}
      <div className="relative w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden border border-white/10">

        {/* ===== HERO‑STYLE SLIDESHOW BACKGROUND ===== */}
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
              <img
                src={SLIDE_IMAGES[currentSlide]}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dark overlay for readability – same as Hero */}
        <div className="absolute inset-0 bg-[#171330]/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171330]/90 via-transparent to-transparent z-0" />

        {/* ===== GLASS FORM OVERLAY ===== */}
        <div className="relative z-10 flex items-center justify-center p-4 md:p-10 min-h-[calc(100vh-20px)]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-[36px] p-8 md:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/15 border border-[#0066ff]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Step 1 of 1</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
                  Tell us who you are
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                  Just the basics to get you in. You can complete the rest any time from your dashboard.
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
                <Field label="Full name" icon={User}>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chen" className={inputCls} />
                </Field>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <Field label="Professional title" icon={Briefcase}>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Founder & CEO" className={inputCls} />
                </Field>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Location" icon={MapPin}>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" className={inputCls} />
                </Field>
                <Field label="Years building" icon={Calendar}>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                </Field>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Briefcase className="w-4 h-4 text-white/50" /> Founder type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FOUNDER_TYPES.map(({ v, label, icon: Icon, hint }) => {
                    const active = type === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setType(v)}
                        className={`relative flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${
                          active
                            ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_8px_24px_rgba(0,102,255,0.45)]"
                            : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/70 hover:border-[#58a6ff]/60 hover:bg-white/10"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-white/50"}`} />
                        <span className="text-sm font-bold leading-tight">{label}</span>
                        <span className={`text-[10px] font-medium ${active ? "text-white/80" : "text-white/40"}`}>{hint}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                    <MessageSquare className="w-4 h-4 text-white/50" /> Headline (one line)
                  </label>
                  <span className="text-[10px] font-bold text-white/40">{headline.length}/120</span>
                </div>
                <Field label="" icon={MessageSquare}>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={120}
                    placeholder="Building the operating system for African fintech."
                    className={inputCls}
                  />
                </Field>
              </motion.div>
            </div>

            <div className="flex items-center justify-between mt-10">
              <span className="text-xs font-medium text-white/40 hidden sm:flex items-center gap-1.5">
                {canContinue ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#20c937]" />
                    All set — ready when you are.
                  </>
                ) : (
                  "Fill in the required fields to continue."
                )}
              </span>
              <button
                onClick={handleFinish}
                disabled={!canContinue || finishing}
                className="group ml-auto px-8 py-3.5 rounded-2xl bg-[#0066ff] hover:bg-[#171330] text-white font-black text-base flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_10px_30px_rgba(23,19,48,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066ff] disabled:hover:shadow-[0_10px_30px_rgba(0,102,255,0.4)]"
              >
                {finishing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Finish & go to step 2
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
          <Icon className="w-4 h-4 text-white/50" /> {label}
        </label>
      )}
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}