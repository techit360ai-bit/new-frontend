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
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-surface-primary rounded-xl border border-border-default p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">
              Organisation profile
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-text-primary">
                {orgProfile.orgName || "Untitled organisation"}
              </h1>
              <VerificationBadge status={orgProfile.verificationStatus} />
            </div>
            <p className="text-sm text-text-muted mt-1">
              {orgProfile.orgType || "—"} · {orgProfile.location || "—"}
              {orgProfile.foundingYear ? ` · founded ${orgProfile.foundingYear}` : ""}
            </p>
          </div>
          <Link
            to="/org/onboarding/step-1"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-status-info-soft hover:bg-status-info-soft text-brand-accent text-sm font-semibold transition-colors flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Re-run onboarding
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-muted font-mono uppercase tracking-wider">
              Profile completeness
            </span>
            <span
              className={`font-bold ${pct === 100 ? "text-status-success" : pct >= 60 ? "text-status-warning" : "text-status-error"}`}
            >
              {completed} / 5 sections · {pct}%
            </span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                pct === 100
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : pct >= 60
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-red-500 to-red-400"
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
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-mono mb-1.5">
              Documents
            </p>
            {orgProfile.verificationDocs.length > 0 ? (
              <ul className="space-y-1.5">
                {orgProfile.verificationDocs.map((d) => (
                  <li
                    key={d}
                    className="text-xs text-text-secondary truncate bg-background-primary rounded px-2 py-1.5 border border-border-subtle"
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
            color="bg-status-info-soft text-brand-accent border-brand-accent"
          />
          <Chips
            label="Sectors"
            values={orgProfile.sectors}
            color="bg-violet-50 text-violet-700 border-violet-100"
          />
          <Chips
            label="Geographies"
            values={orgProfile.geographies}
            color="bg-status-success-soft text-status-success border-status-success"
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
                  className="flex items-center gap-3 bg-background-primary rounded-lg px-3 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-accent to-violet-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">
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
          <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-brand-accent p-4">
            <p className="text-[10px] uppercase tracking-wider text-brand-accent font-mono mb-1.5">
              Current plan
            </p>
            <p className="text-2xl font-bold text-text-primary capitalize">
              {orgProfile.plan}
            </p>
            <Link
              to="/org/billing"
              className="text-xs text-brand-accent hover:text-brand-accent font-semibold mt-2 inline-flex items-center gap-1"
            >
              Manage billing
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Section>

        {/* Footer cta */}
        <div className="lg:col-span-3 rounded-xl border border-border-default bg-surface-primary p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {pct === 100
                ? "Profile complete — your org is ready to broadcast."
                : "Finish your profile to unlock broadcasting and verified posting."}
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Verified orgs can post Opportunities, run Hackathons, and
              broadcast to matching builders.
            </p>
          </div>
          <Link
            to="/org/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent text-white text-sm font-semibold transition-colors flex-shrink-0"
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success-soft text-status-success text-xs font-bold border border-status-success">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-soft text-status-warning text-xs font-bold border border-status-warning">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-secondary text-text-muted text-xs font-bold border border-border-default">
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
    <div className="bg-surface-primary border border-border-default rounded-xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${complete ? "bg-status-success-soft text-status-success" : "bg-surface-secondary text-text-muted"}`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {complete && (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
          )}
        </div>
        <Link
          to={editPath}
          className="text-[11px] font-mono uppercase tracking-wider text-text-disabled hover:text-brand-accent flex items-center gap-1 transition-colors"
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
  icon?: typeof Building2;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-mono mb-1">
        {label}
      </p>
      {value ? (
        <p className="text-sm text-text-primary font-medium flex items-center gap-2 break-words">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-disabled flex-shrink-0" />}
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
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-mono mb-1.5">
        {label}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
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
    <p className="text-xs italic text-text-disabled font-medium">{children}</p>
  );
}
