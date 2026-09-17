import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { useOrgProfile, type OrgTeamMember } from "@/contexts/UserContext";
import { BlobField } from "@/components/ui/blob-field";
import { ImageSlideshow } from "@/components/ui/image-slideshow";
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Crown,
  Mail,
  User,
} from "lucide-react";

const SLIDE_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

const PERKS = [
  { icon: Users, text: "Collaborate with program managers & review panels" },
  { icon: Crown, text: "Granular judge scoring & assessment roles" },
  { icon: Sparkles, text: "Invite mentors to live office-hour sessions" },
];

const ROLES = [
  "Programme Manager",
  "Director / Lead",
  "Judge & Assessor",
  "Ecosystem Mentor",
  "Operations Lead",
];

export function OrgStep4() {
  const navigate = useNavigate();
  const { orgProfile, updateOrgProfile } = useOrgProfile();

  const [members, setMembers] = useState<OrgTeamMember[]>(orgProfile.teamMembers || []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Programme Manager");

  const addMember = () => {
    if (!name.trim() || !email.trim()) return;
    const m: OrgTeamMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    };
    setMembers([...members, m]);
    setName("");
    setEmail("");
    setRole("Programme Manager");
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleNext = () => {
    updateOrgProfile({ teamMembers: members });
    navigate("/org/onboarding/step-5");
  };

  const handleBack = () => navigate("/org/onboarding/step-3");

  const inputCls =
    "w-full h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent transition-all backdrop-blur-sm";

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
              <span className="text-[10px] font-black uppercase tracking-widest text-[#20C997]">Step 4 of 5</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Team & Staff Access
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Add your program directors, judges, and reviewers who will manage cohorts and evaluate submissions.
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
              <span className="text-[10px] font-black text-[#20C997]">4 / 5</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#20C997] to-emerald-400 w-4/5" />
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
                Team Members
              </h2>
              <p className="text-sm text-white/60 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
                Add team members now or later from your settings.
              </p>
            </div>

            {/* Add Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@hub.org"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Role / Responsibility</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputCls} [&>option]:bg-[#171330] [&>option]:text-white`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={addMember}
                disabled={!name.trim() || !email.trim()}
                className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#20C997]/20 border border-[#20C997]/40 text-[#20C997] font-bold text-xs uppercase tracking-wider transition-all hover:bg-[#20C997]/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add Team Member
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2 mb-6 max-h-44 overflow-y-auto custom-scrollbar">
              {members.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-white/15 text-center text-xs text-white/40">
                  No additional members added yet (you can invite team members later).
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{m.name}</span>
                      <span className="text-white/40">{m.email} · {m.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="flex gap-3">
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
