import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap, Package, Sparkles, Plus, X } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

const SUGGESTIONS = ["TypeScript", "tRPC", "Tailwind", "Redis", "Playwright", "Jest", "Figma", "Postgres", "React", "Node.js"];

export function CollabStep3() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [stack, setStack] = useState<string[]>(collaboratorProfile.techStack);
  const [draft, setDraft] = useState("");

  const addChip = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed || stack.includes(trimmed)) { setDraft(""); return; }
    setStack((cur) => [...cur, trimmed]);
    setDraft("");
  };
  const removeChip = (s: string) => setStack((cur) => cur.filter((x) => x !== s));

  const canContinue = stack.length >= 3;

  const fieldsFilled = [stack.length >= 3].filter(Boolean).length;
  const totalFields = 1;

  const persist = () => updateCollaboratorProfile({ techStack: stack });
  const handleNext = () => { persist(); navigate("/collaborator/onboarding/step-4"); };
  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-2"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

  const suggestions = SUGGESTIONS.filter((s) => !stack.includes(s)).slice(0, 8);

  const inputCls =
    "w-full h-12 rounded-xl border border-white/20 bg-white/10 pl-4 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent transition-all backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]";

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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff]">Collaborator • Step 3/6</span>
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
                Tech stack & tools
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Add at least 3. Hit Enter or click the + button to add.
              </p>
            </div>

            <div className="space-y-6">
              {/* Chip display */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <span className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-white/40" /> Your stack</span>
                  <span className="text-[10px] text-white/40">{stack.length} selected</span>
                </label>
                <div className="flex flex-wrap gap-2 min-h-[48px]">
                  {stack.length === 0 ? (
                    <p className="text-sm text-white/30 italic">Start adding your tools below</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                      {stack.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#20C997]/40 bg-[#20C997]/20 text-white/90 text-sm font-medium backdrop-blur-sm">
                          {s}
                          <button type="button" onClick={() => removeChip(s)} className="hover:text-red-300">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Input + Add button */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChip(draft))}
                    placeholder="Add tech (e.g. React, Python)"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => addChip(draft)}
                    className="h-12 w-12 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold text-xl flex items-center justify-center transition-all shadow-sm shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                  <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                    Popular additions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addChip(s)}
                        className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:border-white/30 text-white/60 hover:text-white text-xs transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
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