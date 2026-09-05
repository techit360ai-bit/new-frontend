import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useFounderProfile, type FounderStage } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Building2, Sparkles, Rocket, Repeat, Calendar, Globe, Smile } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Sparkles, text: "Showcase your vision to the ecosystem" },
  { icon: Rocket, text: "Attract early believers and top talent" },
  { icon: Building2, text: "Secure your startup's spot in TechIT" },
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

  const toggleIndustry = (s: string) =>
    setIndustries((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < 3 ? [...cur, s] : cur);

  // Required fields for this step
  const requiredFields = [startupName.trim(), oneLiner.trim(), industries.length >= 1];
  const fieldsFilled = requiredFields.filter(Boolean).length;
  const totalFields = 3;

  const canContinue = startupName.trim() && oneLiner.trim() && industries.length >= 1 && industries.length <= 3;

  const persist = () => updateFounderProfile({ startupName, oneLiner, stage, industries, foundingYear, website, logoEmoji });
  const handleNext = () => { persist(); navigate("/founder/onboarding/step-3"); };
  const handleBack = () => { persist(); navigate("/founder/onboarding/step-1"); };
  const handleSaveExit = () => { persist(); navigate("/"); };

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
              Tell us about your startup.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Give us the snapshot. This is what collaborators and investors will see first.
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
              <span className="text-[10px] font-black text-[#58a6ff]">Step 2 of 6</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#20c937]"
                animate={{ width: `${(2 / 6) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* ===== Right: slideshow + glass form panel ===== */}
        <div className="relative flex items-center justify-center p-6 md:p-14 overflow-hidden">
          <div className="absolute inset-0 z-0"><ImageSlideshow images={SLIDE_IMAGES} /></div>
          <div className="absolute inset-0 bg-[#171330]/50 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171330]/40 via-transparent to-[#171330]/60 z-[1]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 md:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[85vh] hide-scrollbar"
          >
            <div className="flex justify-end mb-4">
              <button onClick={handleSaveExit} className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                Save & exit
              </button>
            </div>

            <div className="lg:hidden mb-8">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/20 border border-[#0066ff]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0066ff]">Step 2 of 6</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                About your startup
              </h1>
              <p className="text-sm text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Give us the snapshot.
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                The Snapshot
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                What are you building?
              </p>
            </div>

            <div className="space-y-4">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <Field label="Startup name" icon={Building2}>
                  <input value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="Acme Inc." className={inputCls} />
                </Field>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <Sparkles className="w-3.5 h-3.5 text-white/30" /> One-liner
                  </label>
                  <span className="text-[10px] font-bold text-white/30">{oneLiner.length}/140</span>
                </div>
                <Field label="" icon={Sparkles}>
                  <input value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} maxLength={140} placeholder="We help African SMEs access working capital." className={inputCls} />
                </Field>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Rocket className="w-3.5 h-3.5 text-white/30" /> Stage
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStage(s)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        stage === s
                          ? "border-[#0066ff] bg-[#0066ff]/20 text-white shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Repeat className="w-3.5 h-3.5 text-white/30" /> Industries <span className="lowercase font-normal">({industries.length} of 1-3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                        industries.includes(ind)
                          ? "border-[#20c937] bg-[#20c937]/20 text-white shadow-[0_0_10px_rgba(32,201,55,0.3)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 pt-2">
                <Field label="Founding year" icon={Calendar}>
                  <input type="number" min={1990} max={2030} value={foundingYear} onChange={(e) => setFoundingYear(Number(e.target.value) || new Date().getFullYear())} className={`${inputCls} tabular-nums`} />
                </Field>
                <Field label="Logo symbol" icon={Smile}>
                  <input value={logoEmoji} onChange={(e) => setLogoEmoji(e.target.value)} maxLength={4} placeholder="TI" className={inputCls} />
                </Field>
              </motion.div>
              
              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
                <Field label="Website (optional)" icon={Globe}>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourstartup.com" className={inputCls} />
                </Field>
              </motion.div>
            </div>

            <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="show" className="flex gap-3 mt-8">
              <button onClick={handleBack} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canContinue}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,102,255,0.4)]"
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

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <div className="relative">
      {label && (
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
          <Icon className="w-3.5 h-3.5 text-white/30" /> {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Icon className="w-4 h-4 text-white/30" />
        </div>
        {children}
      </div>
    </div>
  );
}