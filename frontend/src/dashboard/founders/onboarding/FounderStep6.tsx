import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { persistOnboardingCompletion } from "@/lib/onboarding";
import { roleDashboardPath } from "@/lib/roleRoutes";
import {
  ArrowRight,
  ArrowLeft,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Target,
  Link as LinkIcon,
  Plus,
  X,
  Check,
  Sparkles,
} from "lucide-react";

const BRAND = {
  blue: "#0066ff",
  lightBlue: "#58a6ff",
  green: "#20c937",
  dark: "#171330",
  white: "#ffffff",
};

const SLIDE_IMAGES = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
];

const NEEDS_OPTIONS = [
  "Find collaborators", "Find investors", "Validate the idea", "Build the MVP faster",
  "Customer interviews", "Pricing experiments", "Hire first sales hire",
  "Hackathon momentum", "Mentorship", "Just exploring",
];

export function FounderStep6() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { founderProfile, updateFounderProfile } = useFounderProfile();
  const [github, setGithub] = useState(founderProfile.links.github);
  const [linkedin, setLinkedin] = useState(founderProfile.links.linkedin);
  const [twitter, setTwitter] = useState(founderProfile.links.twitter);
  const [personal, setPersonal] = useState(founderProfile.links.personal);
  const [needs, setNeeds] = useState<string[]>(founderProfile.needsFromTechIT);
  const [pinned, setPinned] = useState<string[]>(founderProfile.pinnedWork);
  const [finishing, setFinishing] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // No required fields – step is always complete (show green check)
  const fieldsFilled = 1;
  const totalFields = 1;
  const isComplete = true;

  const toggleNeed = (n: string) => {
    setNeeds((cur) => {
      if (cur.includes(n)) return cur.filter((x) => x !== n);
      if (cur.length >= 3) return cur;
      return [...cur, n];
    });
  };

  const updatePinned = (i: number, v: string) => setPinned((cur) => cur.map((p, idx) => idx === i ? v : p));
  const removePinned = (i: number) => setPinned((cur) => cur.filter((_, idx) => idx !== i));
  const addPinned = () => { if (pinned.length < 3) setPinned((cur) => [...cur, ""]); };

  const handleFinish = async () => {
    if (finishing) return;
    updateFounderProfile({
      links: { github, linkedin, twitter, personal },
      needsFromTechIT: needs,
      pinnedWork: pinned.filter((u) => u.trim()),
    });
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
    updateFounderProfile({ onboardingComplete: true });
    toast.success(`You're in. Welcome to TechIT, ${founderProfile.name.split(" ")[0]}.`);
    navigate(roleDashboardPath.founder, { replace: true });
  };

  const handleBack = () => {
    updateFounderProfile({
      links: { github, linkedin, twitter, personal },
      needsFromTechIT: needs,
      pinnedWork: pinned.filter((u) => u.trim()),
    });
    navigate("/founder/onboarding/step-5");
  };

  const handleSaveExit = () => {
    updateFounderProfile({
      links: { github, linkedin, twitter, personal },
      needsFromTechIT: needs,
      pinnedWork: pinned.filter((u) => u.trim()),
    });
    navigate("/");
  };

  const inputCls =
    "w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-4 pr-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-[#171330] p-[10px] font-bricolage">
      <div className="relative w-full min-h-[calc(100vh-20px)] rounded-[32px] overflow-hidden border border-white/10">
        {/* Slideshow background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img src={SLIDE_IMAGES[currentSlide]} alt="Background" className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-[#171330]/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171330]/90 via-transparent to-transparent z-0" />

        {/* Glass form */}
        <div className="relative z-10 flex items-center justify-center p-4 md:p-10 min-h-[calc(100vh-20px)]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-[36px] p-8 md:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.75)]"
          >
            <div className="flex justify-end mb-4">
              <button onClick={handleSaveExit} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Save & exit
              </button>
            </div>

            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#0066ff]/15 border border-[#0066ff]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Step 6 of 6</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
                  Goals &amp; links
                </h1>
                <p className="text-white/60 text-sm md:text-base font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                  All optional — but the more you share, the better your matches.
                </p>
              </div>

              {/* Completion ring – always complete */}
              <div className="relative w-14 h-14 shrink-0 hidden sm:block">
                <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={isComplete ? BRAND.green : BRAND.blue}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#20c937]" />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Links */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Github className="w-4 h-4 text-white/50" /> GitHub <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Linkedin className="w-4 h-4 text-white/50" /> LinkedIn <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Twitter className="w-4 h-4 text-white/50" /> X / Twitter <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className={inputCls}
                />
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Globe className="w-4 h-4 text-white/50" /> Personal site <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input
                  value={personal}
                  onChange={(e) => setPersonal(e.target.value)}
                  placeholder="https://yoursite.com"
                  className={inputCls}
                />
              </motion.div>

              {/* Needs */}
              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <Target className="w-4 h-4 text-white/50" /> What do you need from TechIT right now? <span className="font-normal text-white/40">({needs.length} of 3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {NEEDS_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNeed(n)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 ${
                        needs.includes(n)
                          ? "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_4px_12px_rgba(0,102,255,0.3)]"
                          : "border-white/15 bg-white/[0.06] backdrop-blur-sm text-white/60 hover:border-[#58a6ff]/60 hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Pinned work */}
              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                  <LinkIcon className="w-4 h-4 text-white/50" /> Pinned work <span className="font-normal text-white/40">(optional, up to 3 URLs)</span>
                </label>
                <div className="space-y-2">
                  {pinned.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={url}
                        onChange={(e) => updatePinned(i, e.target.value)}
                        placeholder="https://project-url.com"
                        className="flex-1 h-12 rounded-2xl border border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]"
                      />
                      <button
                        type="button"
                        onClick={() => removePinned(i)}
                        className="h-12 w-12 rounded-2xl border border-white/20 bg-white/10 text-white/50 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-center"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                {pinned.length < 3 && (
                  <button
                    type="button"
                    onClick={addPinned}
                    className="mt-2 text-sm font-bold text-[#58a6ff] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add link
                  </button>
                )}
              </motion.div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white/60 backdrop-blur-sm">
                Verify your GitHub / socials / ID in Settings → Verification after you finish.
                Verified founders see more matches.
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={handleBack}
                className="group px-6 py-3 rounded-2xl text-white/70 hover:text-white font-bold text-sm flex items-center gap-2 transition-all hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => void handleFinish()}
                disabled={finishing}
                className="group px-8 py-3.5 rounded-2xl bg-[#0066ff] hover:bg-[#171330] text-white font-black text-base flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_10px_30px_rgba(23,19,48,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066ff] disabled:hover:shadow-[0_10px_30px_rgba(0,102,255,0.4)]"
              >
                {finishing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Finishing…
                  </>
                ) : (
                  <>
                    Finish
                    <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
            {completionError && (
              <p role="alert" className="mt-3 text-right text-sm text-red-300 font-medium">
                {completionError}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}