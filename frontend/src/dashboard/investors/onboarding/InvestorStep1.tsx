import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useInvestorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  DollarSign,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  Shield,
  ArrowRight,
  Briefcase,
  Globe,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Sparkles, text: "Curated deal intelligence & pipeline access" },
  { icon: TrendingUp, text: "Live traction metrics and verified data rooms" },
  { icon: Shield, text: "Syndicate and direct capital allocation tooling" },
];

const INVESTOR_TYPES = [
  { id: "Angel", label: "Angel", desc: "Individual early backer" },
  { id: "VC", label: "VC Fund", desc: "Institutional venture" },
  { id: "Family Office", label: "Family Office", desc: "Private wealth fund" },
  { id: "Corporate Venture", label: "CVC", desc: "Corporate innovation" },
  { id: "Accelerator", label: "Accelerator", desc: "Cohort program backer" },
];

const FUND_SIZES = ["<$1M", "$1M–$10M", "$10M–$100M", "$100M+"];

export function InvestorStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { investorProfile, updateInvestorProfile } = useInvestorProfile();

  const [investorType, setInvestorType] = useState(investorProfile.investorType || "Angel");
  const [location, setLocation] = useState(investorProfile.location || "");
  const [fundSize, setFundSize] = useState(investorProfile.fundSize || "<$1M");
  const [yearsInvesting, setYearsInvesting] = useState(investorProfile.yearsInvesting || 1);
  const [finishing, setFinishing] = useState(false);

  const canContinue = investorType.trim() && location.trim() && fundSize.trim();
  const fieldsFilled = [investorType.trim(), location.trim(), fundSize.trim()].filter(Boolean).length;
  const totalFields = 3;

  const persist = () => updateInvestorProfile({ investorType, location, fundSize, yearsInvesting });

  const handleFinish = async () => {
    persist();
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) {
      setFinishing(false);
      return;
    }
    localStorage.setItem("techit_profile_completion_pending", "investor");
    navigate(roleDashboardPath.investor, { replace: true });
  };

  const inputCls =
    "w-full h-12 rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

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
        {/* ===== Left: brand panel ===== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#171330] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">
                Investor Identity
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Back the next generation of founders.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Set up your investment profile to unlock verified startup deal rooms, metrics, and co-investment syndicates.
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
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Profile progress</span>
              <span className="text-[10px] font-black text-[#20C997]">{fieldsFilled}/{totalFields}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#20C997] to-emerald-400"
                animate={{ width: `${(fieldsFilled / totalFields) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* ===== Right: slideshow + glass form panel ===== */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <ImageSlideshow images={SLIDE_IMAGES} />
          </div>

          <div className="absolute inset-0 bg-[#171330]/50 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171330]/40 via-transparent to-[#171330]/60 z-[1]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[85vh] hide-scrollbar"
          >
            {/* Mobile Header */}
            <div className="lg:hidden mb-8">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#20C997]/20 border border-[#20C997]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20C997]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Investor Profile</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Investor Identity
              </h1>
              <p className="text-sm text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Just the essentials to get started in TechIT.
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Your investment thesis
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Takes under a minute to configure.
              </p>
            </div>

            <div className="space-y-5">
              {/* Investor Type selection */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Briefcase className="w-3.5 h-3.5 text-[#20C997]" /> Investor Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INVESTOR_TYPES.map(({ id, label, desc }) => {
                    const sel = investorType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setInvestorType(id)}
                        className={`relative text-left p-3.5 rounded-xl border transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 shadow-[0_0_15px_rgba(32,201,151,0.3)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span className={`font-black text-sm block ${sel ? "text-white" : "text-white/80"}`}>
                          {label}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-0.5">{desc}</span>
                        {sel && (
                          <motion.div layoutId="investorTypeRing" className="absolute inset-0 rounded-xl border-2 border-[#20C997]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Location */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <MapPin className="w-3.5 h-3.5 text-[#20C997]" /> Location / Headquarters
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Globe className="w-4 h-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, United Kingdom or San Francisco, US"
                    className={inputCls}
                  />
                </div>
              </motion.div>

              {/* Fund / Allocation Size */}
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <DollarSign className="w-3.5 h-3.5 text-[#20C997]" /> Fund / Portfolio Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FUND_SIZES.map((size) => {
                    const sel = fundSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFundSize(size)}
                        className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 text-white shadow-[0_0_12px_rgba(32,201,151,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Years Investing */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Calendar className="w-3.5 h-3.5 text-[#20C997]" /> Years Active Investing
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Calendar className="w-4 h-4 text-white/40" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={yearsInvesting}
                    onChange={(e) => setYearsInvesting(Number(e.target.value) || 0)}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show" className="mt-8">
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canContinue || finishing}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#20C997] to-[#128a64] text-slate-950 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(32,201,151,0.4)]"
              >
                {finishing ? "Setting up..." : (
                  <>Continue to Dashboard <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
