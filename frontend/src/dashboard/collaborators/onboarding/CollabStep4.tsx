import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

const TIMEZONES = ["WAT", "GMT", "EST", "PST", "CET", "JST", "AEST", "IST"];
type EarliestStart = "this-week" | "2-weeks" | "1-month";
type CommitmentStyle = "deep" | "parallel" | "many";

const startOptions: { label: string; value: EarliestStart }[] = [
  { label: "This week", value: "this-week" },
  { label: "2 weeks", value: "2-weeks" },
  { label: "1 month", value: "1-month" },
];

const commitmentOptions: { label: string; sub: string; value: CommitmentStyle }[] = [
  { label: "One startup deeply", sub: "All-in on one build", value: "deep" },
  { label: "2–3 in parallel", sub: "Split focus across builds", value: "parallel" },
  { label: "Many short engagements", sub: "Short bursts, high variety", value: "many" },
];

export function CollabStep4() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [hours, setHours]               = useState(collaboratorProfile.weeklyHours);
  const [tz, setTz]                     = useState(collaboratorProfile.timezone);
  const [earliestStart, setEarliestStart] = useState<EarliestStart>(collaboratorProfile.earliestStart);
  const [commitmentStyle, setCommitment]  = useState<CommitmentStyle>(collaboratorProfile.commitmentStyle);

  const canContinue = hours >= 5 && tz.trim();
  const fieldsFilled = [hours >= 5, tz.trim(), earliestStart, commitmentStyle].filter(Boolean).length;
  const totalFields = 4;

  const persist = () => updateCollaboratorProfile({ weeklyHours: hours, timezone: tz, earliestStart, commitmentStyle });
  const handleNext = () => { persist(); navigate("/collaborator/onboarding/step-5"); };
  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-3"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Collaborator • Step 4/6</span>
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
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step progress</span>
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

        {/* ===== Right: form panel ===== */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <ImageSlideshow images={SLIDE_IMAGES} />
          </div>
          <div className="absolute inset-0 bg-[#171330]/50 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171330]/40 via-transparent to-[#171330]/60 z-[1]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-end mb-4">
                 <button onClick={handleSaveExit} className="text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-wider">Save & exit</button>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Availability
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Help us match you with builds that fit your schedule and working style.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <span>Weekly hours available</span>
                  <span className="text-[#0066ff] bg-[#0066ff]/20 px-2 py-0.5 rounded-full">{hours} hrs/wk</span>
                </label>
                <input
                  type="range" min={5} max={60} value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full accent-[#0066ff] bg-white/10"
                />
                <div className="flex justify-between text-xs text-white/40 mt-2 font-medium">
                  <span>5 hrs</span><span>60 hrs</span>
                </div>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Timezone
                </label>
                <select
                  value={tz} onChange={(e) => setTz(e.target.value)}
                  className="w-full h-12 rounded-xl border border-white/20 bg-black/20 px-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)] appearance-none">
                  {TIMEZONES.map((t) => (
                    <option key={t} value={t} className="bg-[#171330]">{t}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Earliest start
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {startOptions.map(({ label, value }) => (
                    <button key={value} type="button" onClick={() => setEarliestStart(value)}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-medium transition-all ${
                        earliestStart === value ? "border-[#0066ff] bg-[#0066ff]/20 text-white shadow-[0_0_10px_rgba(0,102,255,0.4)]"
                                               : "border-white/15 bg-white/5 text-white/60 hover:border-[#0066ff]/60 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Commitment style
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {commitmentOptions.map(({ label, sub, value }) => (
                    <button key={value} type="button" onClick={() => setCommitment(value)}
                      className={`py-3 px-4 rounded-xl border text-left transition-all ${
                        commitmentStyle === value ? "border-[#0066ff] bg-[#0066ff]/20 shadow-[0_0_10px_rgba(0,102,255,0.4)]"
                                                 : "border-white/15 bg-white/5 hover:border-[#0066ff]/60"}`}>
                      <p className={`text-sm font-semibold ${commitmentStyle === value ? "text-white" : "text-white/80"}`}>{label}</p>
                      <p className={`text-[11px] mt-0.5 ${commitmentStyle === value ? "text-[#58a6ff]" : "text-white/40"}`}>{sub}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex justify-between mt-10"
            >
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
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
