import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useInvestorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  Brain,
  DollarSign,
  Blocks,
  Bot,
  Heart,
  Leaf,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Sparkles, text: "Target exact startup verticals and stages" },
  { icon: Layers, text: "Automated deal syndication matching" },
  { icon: DollarSign, text: "Direct check size filtering & allocation" },
];

const INDUSTRIES = [
  { id: "AI", label: "AI & ML", icon: Brain },
  { id: "Fintech", label: "Fintech", icon: DollarSign },
  { id: "Web3", label: "Web3 / Crypto", icon: Blocks },
  { id: "Robotics", label: "Robotics & Hardware", icon: Bot },
  { id: "Health", label: "HealthTech", icon: Heart },
  { id: "Climate", label: "Climate & CleanTech", icon: Leaf },
];

const STAGES = ["Idea", "Pre-Seed", "Seed", "Series A"];
const CHECK_SIZES = ["$10k–$50k", "$50k–$200k", "$200k–$1M", "$1M+"];

export function InvestorStep2() {
  const navigate = useNavigate();
  const { investorProfile, updateInvestorProfile } = useInvestorProfile();

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    investorProfile.industries || []
  );
  const [stage, setStage] = useState(investorProfile.stage || "Pre-Seed");
  const [checkSize, setCheckSize] = useState(investorProfile.checkSize || "$50k–$200k");

  const toggleIndustry = (id: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    updateInvestorProfile({ industries: selectedIndustries, stage, checkSize });
    navigate("/investor/onboarding/step-3");
  };

  const handleBack = () => {
    navigate("/investor/onboarding/step-1");
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
    <div className="min-h-screen bg-[#081c15] p-[10px] font-bricolage">
      <div className="w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden grid lg:grid-cols-[42%_58%] border border-white/10">
        {/* Left panel */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#081c15] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#081c15] to-[#081c15]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Step 2 of 5</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Sector & Stage Focus
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Define the industries, round stages, and check sizes you actively look to write checks into.
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
              <span className="text-[10px] font-black text-[#20C997]">2 / 5</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#20C997] to-emerald-400 w-2/5" />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <ImageSlideshow images={SLIDE_IMAGES} />
          </div>

          <div className="absolute inset-0 bg-[#081c15]/55 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081c15]/50 via-transparent to-[#081c15]/70 z-[1]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[85vh] hide-scrollbar"
          >
            <div className="mb-8">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Investment Strategy
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Select your preferred sectors and investment stages.
              </p>
            </div>

            <div className="space-y-6">
              {/* Industries */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Brain className="w-3.5 h-3.5 text-[#20C997]" /> Focus Sectors
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INDUSTRIES.map(({ id, label, icon: Icon }) => {
                    const sel = selectedIndustries.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleIndustry(id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 text-white shadow-[0_0_12px_rgba(32,201,151,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${sel ? "text-[#20C997]" : "text-white/40"}`} />
                        <span className="text-xs font-bold truncate">{label}</span>
                        {sel && <Check className="w-3 h-3 text-[#20C997] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Stage Preference */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Layers className="w-3.5 h-3.5 text-[#20C997]" /> Target Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STAGES.map((s) => {
                    const sel = stage === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStage(s)}
                        className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 text-white shadow-[0_0_12px_rgba(32,201,151,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Check Size */}
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <DollarSign className="w-3.5 h-3.5 text-[#20C997]" /> Sweet Spot Check Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CHECK_SIZES.map((cs) => {
                    const sel = checkSize === cs;
                    return (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setCheckSize(cs)}
                        className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 text-white shadow-[0_0_12px_rgba(32,201,151,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {cs}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show" className="mt-8 flex gap-3">
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
