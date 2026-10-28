import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useCollaboratorProfile, type CollaboratorDiscipline } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import { ArrowRight, ArrowLeft, Users, Code2, Zap } from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];
const PERKS = [
  { icon: Code2, text: "Get matched with builds that fit your stack" },
  { icon: Users, text: "Work alongside vetted founders & teams" },
  { icon: Zap, text: "Your profile goes live the moment you finish" },
];

const disciplines: CollaboratorDiscipline[] = [
  "Engineering", "Design", "Product", "Data & ML",
  "DevOps", "Security", "Marketing", "Research",
];

const subSkillsByDiscipline: Record<CollaboratorDiscipline, string[]> = {
  "Engineering": ["React", "TypeScript", "Node.js", "Python", "Go", "Rust", "System design", "Performance", "Mobile (RN/iOS/Android)", "Backend APIs", "Testing", "GraphQL", "Realtime", "Web3"],
  "Design":      ["Product", "Visual", "Brand", "UX research", "Design systems", "Motion", "Illustration", "Prototyping", "3D", "Webflow/Framer", "Figma", "Pitch decks", "Marketing pages", "Iconography"],
  "Product":     ["Discovery", "Roadmapping", "PRDs", "Analytics", "Pricing", "GTM", "Growth experiments", "A/B testing", "Stakeholder mgmt", "Customer interviews", "Spec writing", "Prioritisation", "OKRs", "PMing AI features"],
  "Data & ML":   ["Modelling", "MLOps", "NLP", "CV", "RAG", "Fine-tuning", "Evals", "Recommenders", "Time series", "Forecasting", "SQL", "dbt", "Notebooks", "Dashboards"],
  "DevOps":      ["AWS", "GCP", "Azure", "K8s", "Terraform", "CI/CD", "Observability", "Incident response", "Cost optimization", "Container orchestration", "Edge/CDN", "Serverless", "Networking", "Backups"],
  "Security":    ["AppSec", "Pen testing", "SAST/DAST", "Threat modelling", "IAM", "Compliance (SOC2/ISO/GDPR)", "Secrets mgmt", "Audit logging", "Zero trust", "Crypto", "Incident response", "Bug bounty", "Cloud security", "Red team"],
  "Marketing":   ["Content", "SEO", "Paid ads", "Lifecycle", "Email", "Brand", "Social", "Community", "PR", "Launches", "Partnerships", "Analytics", "Creator marketing", "Founder-led"],
  "Research":    ["User research", "Market research", "Behavioural research", "Quant", "Qual", "Surveys", "Diary studies", "Usability", "Interviews", "Competitive analysis", "Synthesis", "Repository", "Insights", "Strategy"],
};

export function CollabStep2() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [discipline, setDiscipline] = useState<CollaboratorDiscipline | "">(collaboratorProfile.discipline);
  const [subSkills, setSubSkills]   = useState<string[]>(collaboratorProfile.subSkills);
  
  const toggleSkill = (s: string) => setSubSkills((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  const canContinue = discipline && subSkills.length >= 3 && subSkills.length <= 8;

  const fieldsFilled = [discipline, subSkills.length >= 3].filter(Boolean).length;
  const totalFields = 2;

  const persist = () => updateCollaboratorProfile({ discipline, subSkills });
  const handleNext = () => { persist(); navigate("/collaborator/onboarding/step-3"); };
  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-1"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

  const skillOptions = discipline ? subSkillsByDiscipline[discipline] : [];

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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Collaborator • Step 2/6</span>
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
              <h2 className="text-xl md:text-2xl font-black text-white mb-1 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                What do you build?
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Pick one primary discipline, then 3–8 specific skills.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  Primary discipline
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {disciplines.map((d) => (
                    <button key={d} type="button" onClick={() => { setDiscipline(d); setSubSkills([]); }}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        discipline === d ? "border-[#20C997] bg-[#20C997]/20 text-white"
                                         : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </motion.div>

              {discipline && (
                <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                  <label className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest text-white/70 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                    <span>Sub-skills</span>
                    <span className="text-[10px] text-white/40">{subSkills.length} of 3–8</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-all backdrop-blur-sm ${
                          subSkills.includes(s) ? "border-[#20C997] bg-[#20C997]/30 text-white shadow-[0_0_10px_rgba(32,201,151,0.4)]"
                                                : "border-white/15 bg-white/5 text-white/60 hover:border-[#20C997]/60 hover:text-white"}`}>
                        {s}
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
