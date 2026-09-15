import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { persistOnboardingCompletion } from "@/lib/onboarding";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap, Github, Linkedin, Globe, Twitter, Plus, X } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

export function CollabStep6() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [github, setGithub]       = useState(collaboratorProfile.links.github);
  const [linkedin, setLinkedin]   = useState(collaboratorProfile.links.linkedin);
  const [portfolio, setPortfolio] = useState(collaboratorProfile.links.portfolio);
  const [twitter, setTwitter]     = useState(collaboratorProfile.links.twitter);
  const [whyHere, setWhyHere]     = useState(collaboratorProfile.whyHere);
  const [pinned, setPinned]       = useState<string[]>(collaboratorProfile.pinnedWork);
  const [finishing, setFinishing] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const addPinned = () => { if (pinned.length < 3) setPinned((cur) => [...cur, ""]); };
  const removePinned = (i: number) => setPinned((cur) => cur.filter((_, idx) => idx !== i));
  const updatePinned = (i: number, val: string) => setPinned((cur) => cur.map((v, idx) => idx === i ? val : v));

  const persist = () => updateCollaboratorProfile({
    links: { github, linkedin, portfolio, twitter },
    whyHere,
    pinnedWork: pinned.filter((u) => u.trim()),
  });

  const fieldsFilled = [github, linkedin, portfolio, twitter, whyHere, pinned.length > 0].filter(Boolean).length;
  const totalFields = 6;

  const handleFinish = async () => {
    if (finishing) return;
    persist();
    setFinishing(true);
    setCompletionError(null);
    try {
      await persistOnboardingCompletion(updateProfile);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "Profile update failed.");
      setFinishing(false);
      toast.error("Onboarding could not be completed. Please try again.");
      return;
    }
    updateCollaboratorProfile({ onboardingComplete: true });
    toast.success("You're in. Welcome to TechIT.");
    navigate(roleDashboardPath.collaborator, { replace: true });
  };

  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-5"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

  const inputCls = "w-full h-12 rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";
  
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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Collaborator • Step 6/6</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Almost done.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Showcase your best work and tell us what drives you.
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
              <h2 className="text-xl md:text-2xl font-black text-white mb-2 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                Portfolio & goals
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                All optional — but the more you share, the better your matches.
              </p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">GitHub</label>
                  <div className="relative">
                    <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/..." className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">LinkedIn</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/..." className={inputCls} />
                  </div>
                </div>
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="yoursite.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">X / Twitter</label>
                  <div className="relative">
                    <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="x.com/..." className={inputCls} />
                  </div>
                </div>
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center justify-between mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <span>Why are you here?</span>
                  <span className="text-white/40">{whyHere.length}/200</span>
                </label>
                <textarea
                  value={whyHere} onChange={(e) => setWhyHere(e.target.value)} maxLength={200} rows={2}
                  placeholder="What kind of product do you want to build equity in?"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] transition-all backdrop-blur-sm resize-none"
                />
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center justify-between mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <span>Pinned work</span>
                  <span className="text-white/40">{pinned.length}/3 links</span>
                </label>
                <div className="space-y-2">
                  {pinned.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        <input
                          value={url} onChange={(e) => updatePinned(i, e.target.value)}
                          placeholder="project-url.com"
                          className={inputCls}
                        />
                      </div>
                      <button type="button" onClick={() => removePinned(i)}
                        className="h-12 w-12 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors flex items-center justify-center">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {pinned.length < 3 && (
                    <button type="button" onClick={addPinned}
                      className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold uppercase tracking-widest text-[#20C997] hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add link
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex justify-between mt-8"
            >
              <button
                onClick={handleBack}
                className="group px-6 py-3 rounded-2xl text-white/70 hover:text-white font-bold text-sm flex items-center gap-2 transition-all hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => void handleFinish()}
                disabled={finishing}
                className="group px-8 py-3.5 rounded-2xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-black text-base flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(32,201,151,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finishing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    Finishing…
                  </>
                ) : (
                  <>
                    Finish <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
            {completionError && (
              <p role="alert" className="mt-3 text-right text-xs text-red-400 font-medium bg-red-950/50 p-2 rounded-lg border border-red-500/20">
                {completionError}
              </p>
            )}
          </motion.div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}
