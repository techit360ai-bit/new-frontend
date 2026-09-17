import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useOrgProfile } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  ShieldCheck,
  Upload,
  Mail,
  FileText,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: ShieldCheck, text: "Verified badge across all hackathons and programs" },
  { icon: Sparkles, text: "Direct corporate sponsorship & talent matching" },
  { icon: Mail, text: "Custom organisation email domain binding" },
];

export function OrgStep2() {
  const navigate = useNavigate();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [docs, setDocs] = useState<string[]>(orgProfile.verificationDocs || []);
  const [emailDomain, setEmailDomain] = useState(orgProfile.businessEmailDomain || "");

  const addDoc = (name: string) =>
    setDocs((prev) => (prev.includes(name) ? prev : [...prev, name]));
  const removeDoc = (name: string) =>
    setDocs((prev) => prev.filter((d) => d !== name));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => addDoc(f.name));
  };

  const handleNext = () => {
    const status = docs.length > 0 && emailDomain.trim() ? "pending" : "unverified";
    updateOrgProfile({
      verificationDocs: docs,
      businessEmailDomain: emailDomain,
      verificationStatus: status,
    });
    navigate("/org/onboarding/step-3");
  };

  const handleBack = () => navigate("/org/onboarding/step-1");

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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Step 2 of 5</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Organisation Verification
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Verified organisations receive a verified platform badge, priority hackathon listings, and builder trust.
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
                Verification & Domain
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Provide verification materials and official corporate domain.
              </p>
            </div>

            <div className="space-y-5">
              {/* Document upload box */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#20C997]" /> Registration / Tax Docs (Optional)
                </label>
                <label
                  htmlFor="org-docs-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-[#20C997]/60 rounded-2xl p-6 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <Upload className="w-8 h-8 text-white/40 group-hover:text-[#20C997] transition-colors mb-2" />
                  <p className="text-xs font-bold text-white mb-0.5">Click or drag files to upload</p>
                  <p className="text-[10px] text-white/40">PDF, PNG, JPG up to 10MB</p>
                  <input
                    id="org-docs-input"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                </label>

                {docs.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {docs.map((d) => (
                      <div
                        key={d}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-[#20C997] shrink-0" />
                          <span className="text-white truncate">{d}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(d)}
                          className="p-1 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Official email domain */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 mb-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                  <Mail className="w-3.5 h-3.5 text-[#20C997]" /> Official Email Domain
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Mail className="w-4 h-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    placeholder="e.g. @techhub.org or @university.edu"
                    className={inputCls}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="mt-8 flex gap-3">
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
