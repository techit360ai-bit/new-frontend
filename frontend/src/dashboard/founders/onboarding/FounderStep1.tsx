import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useFounderProfile, type FounderExperience } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
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
  Building2,
  TrendingUp,
  Zap
} from "lucide-react";

const SLIDE_IMAGES = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
];

const PERKS = [
  { icon: Building2, text: "Build out your startup profile securely" },
  { icon: TrendingUp, text: "Match with top talent and capital" },
  { icon: Zap, text: "Launch into the ecosystem instantly" },
];

const FOUNDER_TYPES: { v: FounderExperience; label: string; icon: typeof User; hint: string }[] = [
  { v: "first-time", label: "First time", icon: Sparkles, hint: "New to founding" },
  { v: "some-experience", label: "Some experience", icon: Rocket, hint: "1-2 ventures" },
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
    "w-full h-12 rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

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

        {/* ===== Left: animated brand panel ===== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#171330] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#0066ff]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#58a6ff]/15 border border-[#58a6ff]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Founder Profile</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Bring your vision to life.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Just the basics to get you in. Set up your founder profile so we can connect you with the right network.
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
                  <Icon className="w-4 h-4 text-[#58a6ff]" />
                </div>
                <span className="text-white/75 text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Profile progress</span>
              <span className="text-[10px] font-black text-[#58a6ff]">{fieldsFilled}/{totalFields}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#20c937]"
                animate={{ width: `${(fieldsFilled / totalFields) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* ===== Right: slideshow + glass form panel ===== */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          {/* Slideshow background */}
          <div className="absolute inset-0 z-0">
            <ImageSlideshow images={SLIDE_IMAGES} />
          </div>

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-[#171330]/50 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171330]/40 via-transparent to-[#171330]/60 z-[1]" />

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[85vh] hide-scrollbar"
          >
            {/* Mobile-only header */}
            <div className="lg:hidden mb-8">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/20 border border-[#0066ff]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0066ff]">Founder Profile</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Tell us who you are
              </h1>
              <p className="text-sm text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                We'll use this to match you with the right network.
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Your details
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Takes under a minute.
              </p>
            </div>

            <div className="space-y-4">
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

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
                <Field label="Location" icon={MapPin}>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" className={inputCls} />
                </Field>
                <Field label="Years exp." icon={Calendar}>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value) || 0)}
                    className={`${inputCls} tabular-nums`}
                  />
                </Field>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <MessageSquare className="w-3.5 h-3.5 text-white/30" /> Headline
                  </label>
                  <span className="text-[10px] font-bold text-white/30">{headline.length}/120</span>
                </div>
                <Field label="" icon={MessageSquare}>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={120}
                    placeholder="I am building the future of African fintech."
                    className={inputCls}
                  />
                </Field>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Founder experience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FOUNDER_TYPES.map(({ v, label, icon: Icon, hint }) => {
                    const sel = type === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setType(v)}
                        className={`relative text-left p-4 rounded-xl border transition-all ${
                          sel
                            ? "bg-[#0066ff]/20 border-[#0066ff]/50 shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${sel ? "text-[#58a6ff]" : "text-white/40"}`} />
                          <span className={`font-black text-sm ${sel ? "text-white" : "text-white/70"}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">{hint}</p>
                        {sel && (
                          <motion.div layoutId="selRing" className="absolute inset-0 rounded-xl border-2 border-[#0066ff]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show" className="mt-8">
              <button
                onClick={handleFinish}
                disabled={!canContinue || finishing}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,102,255,0.4)]"
              >
                {finishing ? "Completing..." : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="relative">
      {label && (
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
          <Icon className="w-3.5 h-3.5 text-white/30" /> {label}
        </label>
      )}
      <div className="relative">
        {(!label) && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Icon className="w-4 h-4 text-white/30" />
          </div>
        )}
        {(label) && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Icon className="w-4 h-4 text-white/30" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}