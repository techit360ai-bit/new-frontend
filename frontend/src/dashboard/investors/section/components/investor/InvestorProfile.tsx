import { useState } from "react";
import { Link } from "react-router-dom";
import { useInvestorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfileAvatar } from "@/lib/api/users";
import { toast } from "sonner";
import {
  User,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Target,
  Shield,
  Activity,
  Pencil,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  Sparkles,
} from "lucide-react";

export function InvestorProfile() {
  const { investorProfile } = useInvestorProfile();
  const { profile, refreshProfile } = useAuth();
  const [avatarBusy, setAvatarBusy] = useState(false);

  const changeAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    try { await uploadProfileAvatar(file); await refreshProfile(); toast.success("Profile picture updated"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Profile picture upload failed"); }
    finally { setAvatarBusy(false); }
  };

  // Completeness check — each step considered "complete" if its required fields are filled
  const stepStatus = {
    step1: Boolean(
      investorProfile.investorType &&
        investorProfile.location &&
        investorProfile.fundSize,
    ),
    step2: Boolean(
      investorProfile.industries.length > 0 &&
        investorProfile.stage &&
        investorProfile.checkSize,
    ),
    step3: investorProfile.portfolio.length > 0,
    step4: Boolean(investorProfile.riskAppetite),
    step5: investorProfile.dashboardMetrics.length > 0,
  };
  const completedSteps = Object.values(stepStatus).filter(Boolean).length;
  const completePct = Math.round((completedSteps / 5) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-black/[0.1] dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] shadow-sm">
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <User className="m-auto h-7 w-7 text-slate-400" />}
              <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-slate-900/80 dark:bg-black/70 py-1 text-center text-[10px] font-bold text-white">
                {avatarBusy ? "..." : "Update"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={avatarBusy} onChange={(event) => void changeAvatar(event.target.files?.[0])} />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#20C997] font-mono uppercase tracking-wider font-bold">
                  Investor Profile
                </p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Verified Criteria
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {investorProfile.investorType || "Untitled Investor"}
                {investorProfile.location && (
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-lg sm:text-xl ml-2">
                    · {investorProfile.location}
                  </span>
                )}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs sm:text-sm">
                How TechIT prioritises deal flow and recommendations for you based on onboarding.
              </p>
            </div>
          </div>

          <Link
            to="/investor/onboarding/step-1"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#20C997]/10 hover:bg-[#20C997]/20 border border-[#20C997]/20 text-[#20C997] text-xs font-bold transition-all self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5" />
            Re-run Full Onboarding
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Profile Completeness
            </span>
            <span
              className={`font-bold ${completePct === 100 ? "text-[#20C997]" : completePct >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}
            >
              {completedSteps} / 5 sections · {completePct}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                completePct === 100
                  ? "bg-[#20C997]"
                  : completePct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${completePct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1 — Identity */}
        <ProfileSection
          title="Identity"
          icon={User}
          editPath="/investor/onboarding/step-1"
          complete={stepStatus.step1}
        >
          <Field
            label="Type"
            value={investorProfile.investorType}
            icon={Briefcase}
          />
          <Field
            label="Location"
            value={investorProfile.location}
            icon={MapPin}
          />
          <Field
            label="Fund size"
            value={investorProfile.fundSize}
            icon={DollarSign}
          />
          <Field
            label="Years investing"
            value={
              investorProfile.yearsInvesting > 0
                ? `${investorProfile.yearsInvesting} ${investorProfile.yearsInvesting === 1 ? "year" : "years"}`
                : null
            }
            icon={Calendar}
          />
        </ProfileSection>

        {/* Section 2 — Investment Focus */}
        <ProfileSection
          title="Investment Focus"
          icon={Target}
          editPath="/investor/onboarding/step-2"
          complete={stepStatus.step2}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2 font-semibold">
              Industries
            </p>
            {investorProfile.industries.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {investorProfile.industries.map((ind) => (
                  <span
                    key={ind}
                    className="px-2.5 py-1 rounded-full bg-[#20C997]/10 border border-[#20C997]/20 text-[#20C997] text-xs font-semibold"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint>No industries selected yet</EmptyHint>
            )}
          </div>
          <Field label="Stage" value={investorProfile.stage} />
          <Field label="Check size" value={investorProfile.checkSize} />
        </ProfileSection>

        {/* Section 3 — Portfolio */}
        <ProfileSection
          title="Portfolio Companies"
          icon={Briefcase}
          editPath="/investor/onboarding/step-3"
          complete={stepStatus.step3}
        >
          {investorProfile.portfolio.length > 0 ? (
            <ul className="space-y-2 -mt-1">
              {investorProfile.portfolio.map((co) => (
                <li
                  key={co.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {co.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                      {co.stage}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider shrink-0 ml-2 ${
                      co.outcome === "Exited" || co.outcome === "Acquired"
                        ? "bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/20"
                        : co.outcome === "Failed"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {co.outcome}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No portfolio companies recorded yet</EmptyHint>
          )}
        </ProfileSection>

        {/* Section 4 — Risk Appetite */}
        <ProfileSection
          title="Risk Appetite"
          icon={Shield}
          editPath="/investor/onboarding/step-4"
          complete={stepStatus.step4}
        >
          {investorProfile.riskAppetite ? (
            <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-[#20C997] font-mono mb-1 font-bold">
                Preferred Stage & Risk Limit
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {investorProfile.riskAppetite}
              </div>
            </div>
          ) : (
            <EmptyHint>No risk appetite chosen yet</EmptyHint>
          )}
        </ProfileSection>

        {/* Section 5 — Dashboard Metrics */}
        <ProfileSection
          title="Dashboard Metrics"
          icon={Activity}
          editPath="/investor/onboarding/step-5"
          complete={stepStatus.step5}
        >
          {investorProfile.dashboardMetrics.length > 0 ? (
            <ul className="space-y-2 -mt-1">
              {investorProfile.dashboardMetrics.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997] shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No metrics prioritised yet</EmptyHint>
          )}
        </ProfileSection>

        {/* Summary footer card */}
        <div className="lg:col-span-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {completePct === 100
                ? "Your investor profile is fully configured."
                : "Finish setting up your profile to unlock sharper deal flow algorithms."}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Each completed section makes your custom watchlist recommendations and risk parameters more accurate.
            </p>
          </div>
          <Link
            to="/investor"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
          >
            Open Dashboard
            <ArrowRight className="w-4 h-4 text-[#20C997]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  editPath,
  complete,
  children,
}: {
  title: string;
  icon: typeof User;
  editPath: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${complete ? "bg-[#20C997]/15" : "bg-slate-100 dark:bg-white/[0.06]"}`}
          >
            <Icon
              className={`w-4 h-4 ${complete ? "text-[#20C997]" : "text-slate-400"}`}
            />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {complete ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997]" />
          ) : (
            <CircleSlash className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
        <Link
          to={editPath}
          className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-[#20C997] flex items-center gap-1 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Link>
      </div>
      <div className="space-y-3 flex-1">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: typeof User;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-1 font-semibold">
        {label}
      </p>
      {value ? (
        <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-semibold flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {value}
        </p>
      ) : (
        <EmptyHint>Not set</EmptyHint>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs italic text-slate-400 font-medium">{children}</p>
  );
}
