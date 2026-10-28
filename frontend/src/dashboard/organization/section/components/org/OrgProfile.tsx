import { Link } from "react-router-dom";
import { useOrgProfile } from "@/contexts/UserContext";
import {
  Building2,
  ShieldCheck,
  Target,
  Users,
  Award,
  Pencil,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Globe,
  Calendar,
  Hash,
  Mail,
  ArrowRight,
} from "lucide-react";

export function OrgProfile() {
  const { orgProfile } = useOrgProfile();

  const stepStatus = {
    step1: Boolean(
      orgProfile.orgName && orgProfile.orgType && orgProfile.location,
    ),
    step2: Boolean(
      orgProfile.verificationStatus !== "unverified" ||
        orgProfile.verificationDocs.length > 0,
    ),
    step3: orgProfile.programmes.length > 0 && orgProfile.sectors.length > 0,
    step4: orgProfile.teamMembers.length > 0,
    step5: Boolean(orgProfile.plan),
  };
  const completed = Object.values(stepStatus).filter(Boolean).length;
  const pct = Math.round((completed / 5) * 100);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-[#20C997] font-bold mb-1">
              Organisation profile
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {orgProfile.orgName || "Untitled organisation"}
              </h1>
              <VerificationBadge status={orgProfile.verificationStatus} />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              {orgProfile.orgType || "—"} · {orgProfile.location || "—"}
              {orgProfile.foundingYear ? ` · founded ${orgProfile.foundingYear}` : ""}
            </p>
          </div>
          <Link
            to="/org/onboarding/step-1"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20C997]/10 hover:bg-[#20C997]/20 border border-[#20C997]/30 text-[#20C997] text-xs font-bold transition-all flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Re-run onboarding
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Profile completeness
            </span>
            <span
              className={`font-black font-mono ${pct === 100 ? "text-[#20C997]" : pct >= 60 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}
            >
              {completed} / 5 sections · {pct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                pct === 100
                  ? "bg-[#20C997]"
                  : pct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity */}
        <Section
          icon={Building2}
          title="Identity"
          editPath="/org/onboarding/step-1"
          complete={stepStatus.step1}
        >
          <Field
            label="Name"
            value={orgProfile.orgName}
            icon={Building2}
          />
          <Field label="Type" value={orgProfile.orgType} />
          <Field label="Location" value={orgProfile.location} icon={MapPin} />
          <Field
            label="Founded"
            value={
              orgProfile.foundingYear ? String(orgProfile.foundingYear) : null
            }
            icon={Calendar}
          />
          <Field
            label="Registration"
            value={orgProfile.registrationNumber}
            icon={Hash}
          />
          <Field
            label="Website"
            value={orgProfile.website}
            icon={Globe}
          />
        </Section>

        {/* Verification */}
        <Section
          icon={ShieldCheck}
          title="Verification"
          editPath="/org/onboarding/step-2"
          complete={stepStatus.step2}
        >
          <Field
            label="Status"
            value={
              orgProfile.verificationStatus === "verified"
                ? "Verified"
                : orgProfile.verificationStatus === "pending"
                  ? "Pending review"
                  : "Not started"
            }
          />
          <Field
            label="Business email domain"
            value={
              orgProfile.businessEmailDomain
                ? `@${orgProfile.businessEmailDomain}`
                : null
            }
            icon={Mail}
          />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">
              Documents
            </p>
            {orgProfile.verificationDocs.length > 0 ? (
              <ul className="space-y-1.5">
                {orgProfile.verificationDocs.map((d) => (
                  <li
                    key={d}
                    className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate bg-slate-50 dark:bg-white/[0.03] rounded-lg px-2.5 py-2 border border-black/[0.05] dark:border-white/10"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint>No documents uploaded</EmptyHint>
            )}
          </div>
        </Section>

        {/* Programmes */}
        <Section
          icon={Target}
          title="Programmes & Focus"
          editPath="/org/onboarding/step-3"
          complete={stepStatus.step3}
        >
          <Chips
            label="Programmes"
            values={orgProfile.programmes}
            color="bg-[#20C997]/10 text-[#20C997] border-[#20C997]/20"
          />
          <Chips
            label="Sectors"
            values={orgProfile.sectors}
            color="bg-[#20C997]/10 text-[#20C997] border-[#20C997]/20"
          />
          <Chips
            label="Geographies"
            values={orgProfile.geographies}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          />
        </Section>

        {/* Team */}
        <Section
          icon={Users}
          title="Team Members"
          editPath="/org/onboarding/step-4"
          complete={stepStatus.step4}
        >
          {orgProfile.teamMembers.length > 0 ? (
            <ul className="space-y-2">
              {orgProfile.teamMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/10 rounded-xl px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-[#20C997] text-slate-950 flex items-center justify-center text-xs font-black flex-shrink-0">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {m.email} · {m.role}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No team members yet</EmptyHint>
          )}
        </Section>

        {/* Plan */}
        <Section
          icon={Award}
          title="Plan & Tier"
          editPath="/org/onboarding/step-5"
          complete={stepStatus.step5}
        >
          <div className="rounded-xl bg-[#20C997]/10 border border-[#20C997]/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#20C997] font-bold mb-1">
              Current plan
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">
              {orgProfile.plan}
            </p>
            <Link
              to="/org/billing"
              className="text-xs text-[#20C997] hover:underline font-bold mt-2 inline-flex items-center gap-1"
            >
              Manage billing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Section>

        {/* Footer cta */}
        <div className="lg:col-span-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {pct === 100
                ? "Profile complete — your org is ready to broadcast."
                : "Finish your profile to unlock broadcasting and verified posting."}
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
              Verified orgs can post Opportunities, run Hackathons, and
              broadcast to matching builders.
            </p>
          </div>
          <Link
            to="/org/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 text-xs font-bold transition-all flex-shrink-0 shadow-sm"
          >
            Open dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerificationBadge({
  status,
}: {
  status: "unverified" | "pending" | "verified";
}) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#20C997]/10 text-[#20C997] text-xs font-bold border border-[#20C997]/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-white/10">
      <XCircle className="w-3.5 h-3.5" />
      Unverified
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  editPath,
  complete,
  children,
}: {
  icon: typeof Building2;
  title: string;
  editPath: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col transition-all hover:border-[#20C997]/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${complete ? "bg-[#20C997]/10 text-[#20C997]" : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500"}`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {complete && (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997]" />
          )}
        </div>
        <Link
          to={editPath}
          className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-[#20C997] flex items-center gap-1 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Link>
      </div>
      <div className="space-y-4 flex-1">{children}</div>
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
  icon?: typeof Building2;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">
        {label}
      </p>
      {value ? (
        <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 break-words">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#20C997] flex-shrink-0" />}
          {value}
        </p>
      ) : (
        <EmptyHint>Not set</EmptyHint>
      )}
    </div>
  );
}

function Chips({
  label,
  values,
  color,
}: {
  label: string;
  values: string[];
  color: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">
        {label}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}
            >
              {v}
            </span>
          ))}
        </div>
      ) : (
        <EmptyHint>None selected</EmptyHint>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs italic text-slate-400 dark:text-slate-500 font-medium">{children}</p>
  );
}
