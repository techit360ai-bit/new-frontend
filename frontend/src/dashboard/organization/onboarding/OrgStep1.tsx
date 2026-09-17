import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useOrgProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  Building2,
  MapPin,
  Globe,
  Hash,
  Calendar,
  Sparkles,
  ShieldCheck,
  Rocket,
  ArrowRight,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Building2, text: "Host verified hackathons and accelerators" },
  { icon: Rocket, text: "Direct access to top technical & founder talent" },
  { icon: ShieldCheck, text: "Ecosystem grant management and sponsor reporting" },
];

const ORG_TYPES = [
  "Accelerator",
  "Incubator",
  "University",
  "Innovation Hub",
  "Corporate",
  "Foundation",
  "Government Agency",
  "Non-profit",
];

export function OrgStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { orgProfile, updateOrgProfile } = useOrgProfile();

  const [orgName, setOrgName] = useState(orgProfile.orgName || "");
  const [orgType, setOrgType] = useState(orgProfile.orgType || "Accelerator");
  const [location, setLocation] = useState(orgProfile.location || "");
  const [registrationNumber, setRegistrationNumber] = useState(orgProfile.registrationNumber || "");
  const [foundingYear, setFoundingYear] = useState(orgProfile.foundingYear || 2024);
  const [website, setWebsite] = useState(orgProfile.website || "");
  const [finishing, setFinishing] = useState(false);

  const canContinue = orgName.trim() && location.trim() && orgType.trim();
  const fieldsFilled = [orgName.trim(), location.trim(), orgType.trim(), website.trim()].filter(Boolean).length;
  const totalFields = 4;

  const persist = () =>
    updateOrgProfile({
      orgName,
      orgType,
      location,
      registrationNumber,
      foundingYear,
      website,
    });

  const handleFinish = async () => {
    persist();
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) {
      setFinishing(false);
      return;
    }
    localStorage.setItem("techit_profile_completion_pending", "organisation");
    navigate(roleDashboardPath.org, { replace: true });
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
        {/* Left: brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#171330] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#20C997]/30 via-[#171330] to-[#171330]" />
          <BlobField variant="dark" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-[#20C997]/15 border border-[#20C997]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">
                Organisation Onboarding
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Scale your innovation ecosystem.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Launch accelerator cohorts, sponsor hackathons, discover startup talent, and disburse grants with verified transparency.
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

        {/* Right: form panel */}
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
            <div className="mb-6">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Organisation Details
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Enter your organisation's core information.
              </p>
            </div>

            <div className="space-y-4">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Building2 className="w-3.5 h-3.5 text-[#20C997]" /> Organisation name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Building2 className="w-4 h-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Lagos Innovation Hub or Oxford Foundry"
                    className={inputCls}
                  />
                </div>
              </motion.div>

              {/* Org Type Chips */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Sparkles className="w-3.5 h-3.5 text-[#20C997]" /> Organisation type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ORG_TYPES.map((t) => {
                    const sel = orgType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOrgType(t)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                          sel
                            ? "bg-[#20C997]/20 border-[#20C997]/50 text-white shadow-[0_0_12px_rgba(32,201,151,0.25)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <MapPin className="w-3.5 h-3.5 text-[#20C997]" /> Location / HQ
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <MapPin className="w-4 h-4 text-white/40" />
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nairobi, Kenya"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <Globe className="w-3.5 h-3.5 text-[#20C997]" /> Website
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <Globe className="w-4 h-4 text-white/40" />
                    </div>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourhub.org"
                      className={inputCls}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <Hash className="w-3.5 h-3.5 text-[#20C997]" /> Reg / Tax ID (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <Hash className="w-4 h-4 text-white/40" />
                    </div>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="RC-123456"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <Calendar className="w-3.5 h-3.5 text-[#20C997]" /> Year Founded
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <Calendar className="w-4 h-4 text-white/40" />
                    </div>
                    <input
                      type="number"
                      min={1900}
                      max={2030}
                      value={foundingYear}
                      onChange={(e) => setFoundingYear(Number(e.target.value) || 2024)}
                      className={`${inputCls} tabular-nums`}
                    />
                  </div>
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
