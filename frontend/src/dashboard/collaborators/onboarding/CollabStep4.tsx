import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap, Clock, Globe, Calendar } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

const TIMEZONES = ["WAT", "GMT", "EST", "PST", "CET", "JST", "AEST", "IST"];

export function CollabStep4() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [hours, setHours]               = useState(collaboratorProfile.weeklyHours);
  const [tz, setTz]                     = useState(collaboratorProfile.timezone);
  const [earliestStart, setEarliestStart] = useState<any>(collaboratorProfile.earliestStart);
  const [commitmentStyle, setCommitment]  = useState<any>(collaboratorProfile.commitmentStyle);

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
    <div className="min-h-screen bg-[#0a0a0a] p-[10px] font-bricolage">
      <div className="w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden grid lg:grid-cols-[42%_58%] border border-white/10">

        {/* ===== Left Branding ===== */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-[#121212] relative overflow-hidden border-r border-white/10">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997] bg-[#20C997]/10 px-3 py-1 rounded-full border border-[#20C997]/20">
              Step 4 of 6
            </span>
            <h1 className="text-3xl font-black text-white mt-4 tracking-tight">Availability & Logistics</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">Set your availability so projects can rely on your schedule.</p>

            <div className="space-y-4 mt-8">
              {PERKS.map((perk, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-300 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                  <perk.icon className="w-4 h-4 text-[#20C997]" />
                  <span>{perk.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Right Form ===== */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden bg-[#0a0a0a]">
          <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6">Availability Details</h2>

            <div className="space-y-6">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70">
                    <Clock className="w-3.5 h-3.5 text-white/40" /> Weekly commitment
                  </label>
                  <span className="text-[#20C997] bg-[#20C997]/20 px-2.5 py-0.5 rounded-full text-xs font-bold">{hours} hrs/wk</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full accent-[#20C997] bg-white/10 h-2 rounded-lg cursor-pointer"
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/70">
                  <Globe className="w-3.5 h-3.5 text-white/40" /> Timezone
                </label>
                <select
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  className="w-full h-12 rounded-xl border border-white/20 bg-black/20 px-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent transition-all backdrop-blur-sm appearance-none"
                >
                  {TIMEZONES.map((t) => (
                    <option key={t} value={t} className="bg-[#141414] text-white">{t}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-white/40" /> Earliest start date
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "this-week", label: "This week" },
                    { value: "2-weeks", label: "2 weeks" },
                    { value: "1-month", label: "1 month" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEarliestStart(value)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        earliestStart === value
                          ? "border-[#20C997] bg-[#20C997]/20 text-white shadow-[0_0_10px_rgba(32,201,151,0.4)]"
                          : "border-white/15 bg-white/5 text-white/60 hover:border-[#20C997]/60 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/70">
                  <Zap className="w-3.5 h-3.5 text-white/40" /> Preferred engagement style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "deep", label: "Deep" },
                    { value: "parallel", label: "Parallel" },
                    { value: "many", label: "Burst" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCommitment(value)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        commitmentStyle === value
                          ? "border-[#20C997] bg-[#20C997]/20 text-white shadow-[0_0_10px_rgba(32,201,151,0.4)]"
                          : "border-white/15 bg-white/5 text-white/60 hover:border-[#20C997]/60 hover:text-white"
                      }`}
                    >
                      {label}
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
                className="group px-8 py-3.5 rounded-2xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-black text-base flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
