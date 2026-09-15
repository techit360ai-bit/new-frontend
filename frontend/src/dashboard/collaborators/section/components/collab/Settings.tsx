// frontend/src/dashboard/collaborators/section/components/collab/Settings.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Briefcase, Bell, UserCog, LogOut, CheckCircle2, Shield, Sparkles } from "lucide-react";
import {
  useCollaboratorProfile,
  useActiveRoles,
  type CollaboratorDiscipline,
  type NotificationPrefs,
  type Role,
} from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath, roleOnboardingPath } from "@/lib/roleRoutes";
import { fetchNotificationPreferences, saveNotificationPreferences } from "@/lib/api/settings";

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

const sections = [
  { id: "identity",      label: "Account & Identity",   icon: User },
  { id: "skills",        label: "Skills & Availability", icon: Briefcase },
  { id: "notifications", label: "Notifications",         icon: Bell },
  { id: "roles",         label: "Roles & Switching",     icon: UserCog },
];

const roleLabel: Record<Role, string> = {
  founder: "Founder",
  collaborator: "Collaborator",
  investor: "Investor",
  org: "Organization",
};

const roleBlurb: Record<Role, string> = {
  founder: "Lead a startup, recruit your team.",
  collaborator: "Build for equity across projects.",
  investor: "Spot opportunities, build a portfolio.",
  org: "Run programs, hackathons, talent pools.",
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  opportunities: { email: true, inApp: true },
  deadlines:     { email: true, inApp: true },
  payments:      { email: true, inApp: true },
  equityEvents:  { email: true, inApp: true },
  quietHours:    "off",
};

export function Settings() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const { activeRoles, currentRole } = useActiveRoles();
  const { profile, updateProfile, changePassword, signOut } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  // Identity form state
  const [iName,      setIName]      = useState(collaboratorProfile?.name || "");
  const [iTitle,     setITitle]     = useState(collaboratorProfile?.title || "");
  const [iLocation,  setILocation]  = useState(collaboratorProfile?.location || "");
  const [iYears,     setIYears]     = useState(collaboratorProfile?.yearsExperience ?? 0);
  const [iHeadline,  setIHeadline]  = useState(collaboratorProfile?.headline || "");
  const [iAvatar,    setIAvatar]    = useState(collaboratorProfile?.avatarUrl || "");
  const iEmail                       = profile?.email ?? "";
  const [iCurrentPw, setICurrentPw] = useState("");
  const [iPw1, setIPw1]             = useState("");
  const [iPw2, setIPw2]             = useState("");

  // Skills form state
  const [sDisc,      setSDisc]      = useState<CollaboratorDiscipline | "">(
    (disciplines.includes(collaboratorProfile?.discipline as CollaboratorDiscipline)
      ? collaboratorProfile.discipline
      : "Engineering") as CollaboratorDiscipline
  );
  const [sSub,       setSSub]       = useState<string[]>(collaboratorProfile?.subSkills || []);
  const [sStack,     setSStack]     = useState<string[]>(collaboratorProfile?.techStack || []);
  const [sStackDraft, setSStackDraft] = useState("");
  const [sHours,     setSHours]     = useState(collaboratorProfile?.weeklyHours ?? 20);
  const [sCommit,    setSCommit]    = useState<typeof collaboratorProfile.commitmentStyle>(collaboratorProfile?.commitmentStyle || "deep");
  const [sPref,      setSPref]      = useState(collaboratorProfile?.equityPreference ?? 40);
  const [sFloor,     setSFloor]     = useState(collaboratorProfile?.minCashFloor ?? 0);
  const [sVesting,   setSVesting]   = useState<typeof collaboratorProfile.vestingComfort>(collaboratorProfile?.vestingComfort || "standard");

  // Notifications form state
  const [nPrefs, setNPrefs] = useState<NotificationPrefs>(() => ({
    ...DEFAULT_NOTIFICATIONS,
    ...(collaboratorProfile?.notifications || {}),
  }));

  // Anchor scroll on mount
  const identityRef      = useRef<HTMLDivElement>(null);
  const skillsRef        = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const rolesRef         = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    identity: identityRef, skills: skillsRef, notifications: notificationsRef, roles: rolesRef,
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && sectionRefs[hash]?.current) {
      sectionRefs[hash].current!.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    fetchNotificationPreferences<NotificationPrefs>("collaborator")
      .then((preferences) => {
        if (!alive || Object.keys(preferences).length === 0) return;
        setNPrefs((current) => ({ ...current, ...preferences }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const saveIdentity = async () => {
    setSaving("identity");
    const [firstName, ...rest] = iName.trim().split(/\s+/);
    const lastName = rest.join(" ");
    const updates = {
      name: iName, title: iTitle, location: iLocation,
      yearsExperience: iYears, headline: iHeadline, avatarUrl: iAvatar,
    };
    const result = await updateProfile({
      firstName: firstName || profile?.firstName || "",
      lastName,
      title: iTitle,
      country: iLocation,
      yearsExperience: iYears,
      bio: iHeadline,
      avatarUrl: iAvatar || null,
    });
    setSaving(null);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    updateCollaboratorProfile(updates);
    toast.success("Profile saved");
  };

  const saveSkills = async () => {
    setSaving("skills");
    const updates = {
      discipline: sDisc, subSkills: sSub, techStack: sStack,
      weeklyHours: sHours, commitmentStyle: sCommit,
      equityPreference: sPref, minCashFloor: sFloor, vestingComfort: sVesting,
    };
    const result = await updateProfile({
      discipline: sDisc,
      subSkills: sSub,
      techStack: sStack,
      skills: [...new Set([...sSub, ...sStack])],
      weeklyHours: sHours,
      commitmentStyle: sCommit,
      equityPreference: sPref,
      minCashFloor: sFloor,
      vestingComfort: sVesting,
    });
    setSaving(null);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    updateCollaboratorProfile(updates);
    toast.success("Skills & availability saved");
  };

  const saveNotifications = async () => {
    setSaving("notifications");
    try {
      const persisted = await saveNotificationPreferences("collaborator", nPrefs);
      updateCollaboratorProfile({ notifications: persisted });
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification preferences could not be saved.");
    } finally {
      setSaving(null);
    }
  };

  const updatePassword = async () => {
    if (!iCurrentPw || !iPw1 || iPw1 !== iPw2) { toast.error("Passwords don't match"); return; }
    setSaving("password");
    const result = await changePassword(iCurrentPw, iPw1);
    setSaving(null);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    setICurrentPw(""); setIPw1(""); setIPw2("");
    toast.success("Password updated");
  };

  const addStackChip = (v: string) => {
    const t = v.trim(); if (!t || sStack.includes(t)) { setSStackDraft(""); return; }
    setSStack([...sStack, t]); setSStackDraft("");
  };

  const toggleSubSkill = (s: string) => setSSub((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

  const handleRoleAction = (role: Role) => {
    if (role === currentRole) return;
    if (activeRoles.has(role)) navigate(roleDashboardPath[role]);
    else                       navigate(roleOnboardingPath[role]);
  };

  const updateNotifGroup = (key: "opportunities" | "deadlines" | "payments" | "equityEvents", channel: "email" | "inApp", value: boolean) => {
    setNPrefs((cur) => ({ ...cur, [key]: { ...cur[key], [channel]: value } }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your identity, technical disciplines, notifications, and active roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1">
          <ul className="space-y-1 sticky top-6">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => sectionRefs[s.id]?.current?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#20C997]" />
                    <span>{s.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="lg:col-span-3 space-y-6">
          {/* Identity */}
          <section ref={identityRef} id="identity" className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Account & Identity</h2>
            <div className="space-y-4">
              <Row label="Avatar URL"><Input value={iAvatar} onChange={setIAvatar} type="url" placeholder="https://..." /></Row>
              <Row label="Full Name"><Input value={iName} onChange={setIName} /></Row>
              <Row label="Professional Title"><Input value={iTitle} onChange={setITitle} /></Row>
              <Row label="Location"><Input value={iLocation} onChange={setILocation} /></Row>
              <Row label="Years of Experience"><Input value={String(iYears)} onChange={(v) => setIYears(Number(v) || 0)} type="number" /></Row>
              <Row label="Headline & Bio"><Input value={iHeadline} onChange={setIHeadline} /></Row>
              <Row label="Contact Email">
                <input value={iEmail} readOnly className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-100 dark:bg-white/[0.03] text-slate-500" />
              </Row>
              <Row label="Change Password">
                <div className="space-y-2.5">
                  <Input value={iCurrentPw} onChange={setICurrentPw} type="password" placeholder="Current password" />
                  <Input value={iPw1} onChange={setIPw1} type="password" placeholder="New password" />
                  <Input value={iPw2} onChange={setIPw2} type="password" placeholder="Confirm new password" />
                  <button
                    onClick={() => void updatePassword()}
                    disabled={!iCurrentPw || !iPw1 || iPw1 !== iPw2 || saving === "password"}
                    className="text-xs px-3.5 py-2 border border-black/[0.08] dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {saving === "password" ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </Row>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                disabled={saving === "identity"}
                onClick={() => void saveIdentity()}
                className="px-5 py-2.5 text-xs bg-[#20C997] hover:bg-[#1db587] disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-sm transition-all"
              >
                {saving === "identity" ? "Saving..." : "Save Identity"}
              </button>
            </div>
          </section>

          {/* Skills & Availability */}
          <section ref={skillsRef} id="skills" className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Skills & Availability</h2>

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Primary Discipline</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {disciplines.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setSDisc(d); setSSub([]); }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      sDisc === d
                        ? "border-[#20C997] bg-[#20C997]/10 text-[#20C997]"
                        : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {sDisc && subSkillsByDiscipline[sDisc as CollaboratorDiscipline] && (
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Sub-skills <span className="text-slate-400 font-normal">({(sSub || []).length} selected)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(subSkillsByDiscipline[sDisc as CollaboratorDiscipline] || []).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubSkill(s)}
                      className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                        sSub?.includes(s)
                          ? "border-[#20C997] bg-[#20C997]/10 text-[#20C997]"
                          : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {(sStack || []).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {s}
                    <button onClick={() => setSStack(sStack.filter((x) => x !== s))} className="text-slate-400 hover:text-red-500 font-bold">×</button>
                  </span>
                ))}
              </div>
              <input
                value={sStackDraft}
                onChange={(e) => setSStackDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStackChip(sStackDraft); } }}
                placeholder="Add a tool (e.g. Docker, GraphQL) — hit Enter"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Weekly Hours Committed</p>
                <span className="text-xs font-extrabold text-[#20C997]">{sHours} hrs/wk</span>
              </div>
              <input type="range" min={5} max={60} value={sHours} onChange={(e) => setSHours(Number(e.target.value))} className="w-full accent-[#20C997]" />
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Commitment Style</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "deep" as const,     label: "One deeply" },
                  { v: "parallel" as const, label: "2–3 parallel" },
                  { v: "many" as const,     label: "Many short" },
                ]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setSCommit(opt.v)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      sCommit === opt.v
                        ? "border-[#20C997] bg-[#20C997]/10 text-[#20C997]"
                        : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Equity vs Cash Preference</p>
                <span className="text-xs font-extrabold text-[#20C997]">{sPref}% equity / {100 - sPref}% cash</span>
              </div>
              <input type="range" min={0} max={100} value={sPref} onChange={(e) => setSPref(Number(e.target.value))} className="w-full accent-[#20C997]" />
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Min Cash Floor (USD / mo)</p>
              <Input value={String(sFloor)} onChange={(v) => setSFloor(Number(v) || 0)} type="number" />
            </div>

            <div className="mb-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Vesting Schedule Comfort</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "1y-cliff-4y" as const, label: "1y cliff, 4y" },
                  { v: "standard" as const,    label: "Standard" },
                  { v: "custom" as const,      label: "Custom" },
                ]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setSVesting(opt.v)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      sVesting === opt.v
                        ? "border-[#20C997] bg-[#20C997]/10 text-[#20C997]"
                        : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                disabled={saving === "skills"}
                onClick={() => void saveSkills()}
                className="px-5 py-2.5 text-xs bg-[#20C997] hover:bg-[#1db587] disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-sm transition-all"
              >
                {saving === "skills" ? "Saving..." : "Save Skills & Availability"}
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section ref={notificationsRef} id="notifications" className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Notification Preferences</h2>
            <div className="space-y-3">
              <NotifGroup label="New opportunities matching your skills"
                email={nPrefs.opportunities.email} inApp={nPrefs.opportunities.inApp}
                onChange={(c, v) => updateNotifGroup("opportunities", c, v)} />
              <NotifGroup label="Task deadlines & sprint reminders"
                email={nPrefs.deadlines.email} inApp={nPrefs.deadlines.inApp}
                onChange={(c, v) => updateNotifGroup("deadlines", c, v)} />
              <NotifGroup label="Payments & cash payouts"
                email={nPrefs.payments.email} inApp={nPrefs.payments.inApp}
                onChange={(c, v) => updateNotifGroup("payments", c, v)} />
              <NotifGroup label="Equity events (vesting, new grants, dilution)"
                email={nPrefs.equityEvents.email} inApp={nPrefs.equityEvents.inApp}
                onChange={(c, v) => updateNotifGroup("equityEvents", c, v)} />
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Quiet Hours</p>
              <select
                value={nPrefs.quietHours}
                onChange={(e) => setNPrefs((cur) => ({ ...cur, quietHours: e.target.value as typeof cur.quietHours }))}
                className="h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              >
                <option value="off">Off</option>
                <option value="10pm-8am">10pm – 8am</option>
                <option value="weekends">Always quiet on weekends</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                disabled={saving === "notifications"}
                onClick={() => void saveNotifications()}
                className="px-5 py-2.5 text-xs bg-[#20C997] hover:bg-[#1db587] disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-sm transition-all"
              >
                {saving === "notifications" ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </section>

          {/* Roles & Switching */}
          <section ref={rolesRef} id="roles" className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Roles & Switching</h2>
            <div className="space-y-3">
              {(["collaborator", "founder", "investor", "org"] as Role[]).map((role) => {
                const active = activeRoles.has(role);
                const isCurrent = role === currentRole;
                return (
                  <div
                    key={role}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-[#20C997]/10 border-[#20C997]/30"
                        : "border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-[#20C997]" : "bg-slate-300 dark:bg-white/20"}`}></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {roleLabel[role]}
                        {isCurrent && <span className="ml-2 text-[10px] text-[#20C997] font-semibold uppercase">Current Role</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{roleBlurb[role]}</p>
                    </div>
                    <button
                      onClick={() => handleRoleAction(role)}
                      disabled={isCurrent}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                        isCurrent
                          ? "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-default"
                          : active
                            ? "bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white"
                            : "border border-[#20C997] text-[#20C997] hover:bg-[#20C997]/10"
                      }`}
                    >
                      {isCurrent ? "Active" : active ? "Switch Role" : "Activate Role"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10 flex justify-end">
              <button
                onClick={() => { void signOut(); }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
    />
  );
}

function NotifGroup({ label, email, inApp, onChange }: { label: string; email: boolean; inApp: boolean; onChange: (channel: "email" | "inApp", value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.06] last:border-0 text-xs">
      <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
          <input type="checkbox" checked={email} onChange={(e) => onChange("email", e.target.checked)} className="accent-[#20C997] rounded" /> Email
        </label>
        <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
          <input type="checkbox" checked={inApp} onChange={(e) => onChange("inApp", e.target.checked)} className="accent-[#20C997] rounded" /> In-App
        </label>
      </div>
    </div>
  );
}
