import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { User, MapPin, Briefcase, Calendar, MessageSquare, ArrowRight, Users, Code2, Zap } from "lucide-react";

const SLIDE_IMAGES = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
];

const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

export function CollabStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [name, setName] = useState(collaboratorProfile.name);
  const [title, setTitle] = useState(collaboratorProfile.title);
  const [location, setLocation] = useState(collaboratorProfile.location);
  const [years, setYears] = useState(collaboratorProfile.yearsExperience);
  const [headline, setHeadline] = useState(collaboratorProfile.headline);
  const [finishing, setFinishing] = useState(false);

  const canContinue = name.trim() && title.trim() && location.trim() && years >= 0 && headline.trim();
  const fieldsFilled = [name.trim(), title.trim(), location.trim(), headline.trim()].filter(Boolean).length;
  const totalFields = 4;

  const handleNext = async () => {
    updateCollaboratorProfile({ name, title, location, yearsExperience: years, headline });
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) { setFinishing(false); return; }
    localStorage.setItem("techit_profile_completion_pending", "collaborator");
    navigate(roleDashboardPath.collaborator, { replace: true });
  };

  // Glass‑friendly input class
  const inputCls =
    "w-full h-12 rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

  const fieldVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.1 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Collaborator</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Build alongside founders who need you.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Set up your profile once — we'll use it to match you with the right teams and builds.
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
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)]"
          >
            {/* Mobile-only header */}
            <div className="lg:hidden mb-8">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/20 border border-[#0066ff]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0066ff]">Collaborator</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Tell us who you are
              </h1>
              <p className="text-sm text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                We'll use this to match you with the right builds.
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
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Frontend Engineer" className={inputCls} />
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
                    placeholder="I ship product-grade React systems quickly."
                    className={inputCls}
                  />
                </Field>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={handleNext}
                disabled={!canContinue || finishing}
                className="group w-full h-13 py-3.5 rounded-xl bg-[#0066ff] hover:bg-[#171330] text-white font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_10px_30px_rgba(23,19,48,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0066ff] disabled:hover:shadow-[0_10px_30px_rgba(0,102,255,0.4)]"
              >
                {finishing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Finish & go to dashboard
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-white/40 mt-3 font-medium [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
                {canContinue ? "Looks good — you're ready." : "Fill in every field to continue."}
              </p>
            </motion.div>
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
        <label className="flex items-center gap-2 mb-1.5 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
          <Icon className="w-3.5 h-3.5 text-white/30" /> {label}
        </label>
      )}
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}