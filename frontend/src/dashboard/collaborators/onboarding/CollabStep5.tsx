import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap, ChevronDown } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

type VestingComfort = "standard" | "1y-cliff-4y" | "custom";

const vestingOptions: { label: string; sub: string; value: VestingComfort }[] = [
  { label: "1y cliff, 4y vest", sub: "No equity until year 1", value: "1y-cliff-4y" },
  { label: "Standard (4y, 1y cliff)", sub: "Most common structure", value: "standard" },
  { label: "Custom", sub: "Let's talk about it", value: "custom" },
];

export function CollabStep5() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [pref, setPref]     = useState(collaboratorProfile.equityPreference);
  const [floor, setFloor]   = useState(collaboratorProfile.minCashFloor);
  const [vesting, setVesting] = useState<VestingComfort>(collaboratorProfile.vestingComfort);

  const canContinue = pref >= 0 && pref <= 100 && floor >= 0;
  const fieldsFilled = [pref >= 0 && pref <= 100, floor >= 0, vesting].filter(Boolean).length;
  const totalFields = 3;

  const persist = () => updateCollaboratorProfile({ equityPreference: pref, minCashFloor: floor, vestingComfort: vesting });
  const handleNext = () => { persist(); navigate("/collaborator/onboarding/step-6"); };
  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-4"); };
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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Collaborator • Step 5/6</span>
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
                  <Icon className="w-4 h-4 text-[#20C997]" />
                </div>
                <span className="text-white/75 text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step progress</span>
              <span className="text-[10px] font-black text-[#20C997]">{fieldsFilled}/{totalFields}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#20C997]"
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
              <h2 className="text-xl md:text-2xl font-black text-white mb-2 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Building for Equity
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)] leading-relaxed">
                TechIT is built on the idea that contributors should own what they build. Every engagement is a mix of cash and equity. Your preference shapes the opportunities we surface.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <span>Equity / cash split preference</span>
                </label>
                <input
                  type="range" min={0} max={100} value={pref}
                  onChange={(e) => setPref(Number(e.target.value))}
                  className="w-full accent-[#20C997] bg-white/10"
                />
                <div className="flex justify-between items-center text-xs text-white/40 mt-2 font-medium">
                  <span>Cash heavy</span>
                  <span className="text-sm font-semibold text-[#20C997]">{pref}% equity / {100 - pref}% cash</span>
                  <span>Equity heavy</span>
                </div>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Minimum cash floor (per month)
                </label>
                <input
                  type="number" min={0} step={100} value={floor}
                  onChange={(e) => setFloor(Number(e.target.value) || 0)}
                  placeholder="e.g. 2000"
                  className="w-full h-12 rounded-xl border border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent transition-all backdrop-blur-sm tabular-nums"
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Vesting comfort
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {vestingOptions.map(({ label, sub, value }) => (
                    <button key={value} type="button" onClick={() => setVesting(value)}
                      className={`py-3 px-4 rounded-xl border text-left transition-all ${
                        vesting === value ? "border-[#20C997] bg-[#20C997]/20 shadow-[0_0_10px_rgba(32,201,151,0.4)]"
                                         : "border-white/15 bg-white/5 hover:border-[#20C997]/60"}`}>
                      <p className={`text-sm font-semibold ${vesting === value ? "text-white" : "text-white/80"}`}>{label}</p>
                      <p className={`text-[11px] mt-0.5 ${vesting === value ? "text-[#20C997]" : "text-white/40"}`}>{sub}</p>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <details className="group rounded-xl border border-white/15 bg-white/5 overflow-hidden transition-all hover:bg-white/10">
                  <summary className="px-4 py-3 text-sm font-semibold text-white/80 cursor-pointer list-none flex items-center justify-between">
                    How equity works on TechIT
                    <ChevronDown className="w-4 h-4 text-white/40 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 pt-2">
                    <ul className="space-y-2 text-sm text-white/60">
                      <li>• Vesting is tracked on-platform — you always know your earned stake.</li>
                      <li>• Dilution protection clauses are negotiated per engagement, not platform-wide.</li>
                      <li>• TechIT acts as cap-table custodian, holding your equity until a liquidity event.</li>
                    </ul>
                  </div>
                </details>
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
                className="group px-8 py-3.5 rounded-2xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-black text-base flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(32,201,151,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
