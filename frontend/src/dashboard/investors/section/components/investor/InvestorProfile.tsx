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
    <div className="min-h-screen bg-background-inverse">
      {/* Header */}
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-inverse-strong bg-background-inverse">
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <User className="m-auto h-7 w-7 text-text-on-inverse-disabled" />}
              <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-black/70 py-1 text-center text-[10px] text-white">
                {avatarBusy ? "..." : "Update"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={avatarBusy} onChange={(event) => void changeAvatar(event.target.files?.[0])} />
              </label>
            </div>
          <div>
            <p className="text-xs text-text-on-inverse-disabled font-mono uppercase tracking-wider mb-1">
              Investor profile
            </p>
            <h1 className="text-3xl font-bold text-white">
              {investorProfile.investorType || "Untitled Investor"}
              {investorProfile.location && (
                <span className="text-text-on-inverse-muted font-normal ml-2 text-xl">
                  · {investorProfile.location}
                </span>
              )}
            </h1>
            <p className="text-text-on-inverse-muted mt-1 text-sm">
              How TechIT prioritises deal flow for you. Everything below comes
              from your onboarding answers.
            </p>
          </div>

          </div>

          <Link
            to="/investor/onboarding/step-1"
            className="px-4 py-2.5 rounded-lg bg-status-success/10 hover:bg-status-success/20 border border-status-success/30 text-status-success text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Re-run full onboarding
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-text-on-inverse-muted uppercase tracking-wider">
              Profile completeness
            </span>
            <span
              className={`font-bold ${completePct === 100 ? "text-status-success" : completePct >= 60 ? "text-status-warning" : "text-rose-400"}`}
            >
              {completedSteps} / 5 sections · {completePct}%
            </span>
          </div>
          <div className="h-2 bg-surface-inverse-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                completePct === 100
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : completePct >= 60
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-rose-500 to-rose-400"
              }`}
              style={{ width: `${completePct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <p className="text-[10px] uppercase tracking-wider text-text-on-inverse-disabled font-mono mb-2">
              Industries
            </p>
            {investorProfile.industries.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {investorProfile.industries.map((ind) => (
                  <span
                    key={ind}
                    className="px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/20 text-status-success text-xs font-medium"
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
                  className="flex items-center justify-between rounded-lg bg-surface-inverse-muted/40 border border-border-inverse px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {co.name}
                    </div>
                    <div className="text-[10px] text-text-on-inverse-disabled font-mono uppercase tracking-wider">
                      {co.stage}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex-shrink-0 ml-2 ${
                      co.outcome === "Exited" || co.outcome === "Acquired"
                        ? "bg-status-success/10 text-status-success border border-status-success/20"
                        : co.outcome === "Failed"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-status-info/10 text-status-info border border-status-info/20"
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
            <div className="bg-gradient-to-br from-emerald-500/10 to-brand-primary/10 border border-status-success/20 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-status-success font-mono mb-1.5">
                Preferred stage
              </div>
              <div className="text-base font-semibold text-white">
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
            <ul className="space-y-1.5 -mt-1">
              {investorProfile.dashboardMetrics.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-2 text-sm text-text-on-inverse-secondary"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No metrics prioritised yet</EmptyHint>
          )}
        </ProfileSection>

        {/* Summary footer card */}
        <div className="lg:col-span-3 rounded-lg border border-border-inverse bg-surface-inverse p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {completePct === 100
                ? "Your profile is fully tuned."
                : "Finish setting up your profile to unlock sharper deal flow."}
            </h3>
            <p className="text-xs text-text-on-inverse-muted mt-1">
              Each completed section makes the dashboard and watchlist
              recommendations more precise.
            </p>
          </div>
          <Link
            to="/investor"
            className="px-4 py-2 rounded-lg bg-surface-primary/5 hover:bg-surface-primary/10 border border-border-inverse-strong text-text-on-inverse-secondary text-sm font-medium flex items-center gap-2 transition-colors flex-shrink-0"
          >
            Open dashboard
            <ArrowRight className="w-4 h-4" />
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
    <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${complete ? "bg-status-success/10" : "bg-surface-inverse-muted"}`}
          >
            <Icon
              className={`w-4 h-4 ${complete ? "text-status-success" : "text-text-on-inverse-disabled"}`}
            />
          </div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {complete ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
          ) : (
            <CircleSlash className="w-3.5 h-3.5 text-text-muted" />
          )}
        </div>
        <Link
          to={editPath}
          className="text-[11px] font-mono uppercase tracking-wider text-text-on-inverse-disabled hover:text-status-success flex items-center gap-1 transition-colors"
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
      <p className="text-[10px] uppercase tracking-wider text-text-on-inverse-disabled font-mono mb-1">
        {label}
      </p>
      {value ? (
        <p className="text-sm text-white font-medium flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-on-inverse-disabled flex-shrink-0" />}
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
    <p className="text-xs italic text-text-muted font-medium">{children}</p>
  );
}
