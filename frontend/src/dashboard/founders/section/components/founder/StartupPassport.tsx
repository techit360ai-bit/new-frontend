import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Award, Trophy, Users } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";
import { derivePassport, type PassportRecord } from "@/dashboard/_shared/passport/passport";
import { momentumColor } from "@/dashboard/_shared/hackathon/momentum";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-default rounded-xl p-4 bg-surface-primary">
      <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
      <p className="text-[11px] text-text-muted uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  );
}

function RecordCard({ record }: { record: PassportRecord }) {
  const teammates = record.teammates ?? [];
  const briefColor = record.briefOverall != null ? momentumColor(record.briefOverall) : null;
  return (
    <div className="border border-border-default rounded-xl p-4 bg-surface-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-text-primary truncate">{record.teamName}</h4>
          <p className="text-xs text-text-muted mt-0.5 capitalize">{record.role}</p>
        </div>
        {record.completed && record.placement != null ? (
          <span className="shrink-0 text-xs font-semibold text-status-success bg-status-success-soft border border-status-success rounded-full px-2.5 py-1">
            #{record.placement} of {record.cohortSize}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-text-muted bg-background-primary border border-border-default rounded-full px-2.5 py-1 capitalize">
            {record.stage.replace("-", " ")}
          </span>
        )}
      </div>

      {record.briefOverall != null && briefColor && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Brief score</span>
            <span className={`text-xs font-semibold ${briefColor.text}`}>{record.briefOverall}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-secondary">
            <div className={`h-1.5 rounded-full ${briefColor.bar}`} style={{ width: `${record.briefOverall}%` }} />
          </div>
        </div>
      )}

      {record.topJudgeComment && (
        <p className="text-xs text-text-muted italic mt-3">“{record.topJudgeComment}”</p>
      )}

      {teammates.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] text-text-disabled uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Team
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teammates.map((t) => (
              <Link
                key={t.collaboratorId}
                to="/matchresults"
                className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 hover:bg-violet-100"
              >
                {t.name} · {t.role}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StartupPassport() {
  const { founderProfile } = useFounderProfile();
  const passport = useMemo(
    () => derivePassport(founderProfile.hackathonRegistrations ?? [], Date.now()),
    [founderProfile.hackathonRegistrations],
  );

  return (
    <section className="border border-border-default rounded-xl p-6 bg-surface-primary">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-text-primary">Startup Passport</h2>
        <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
          Visible to investors
        </span>
      </div>
      <p className="text-sm text-text-muted mb-5">Your verified hackathon track record across events.</p>

      {!passport.hasActivity ? (
        <div className="border border-dashed border-border-strong rounded-xl p-8 text-center">
          <Award className="w-7 h-7 text-text-on-inverse-secondary mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            No hackathon history yet.{" "}
            <Link to="/incubation-hub?panel=hackathon" className="text-violet-600 hover:underline">
              Enter a hackathon
            </Link>{" "}
            to start your passport.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Hackathons" value={String(passport.hackathonsEntered)} />
            <StatCard
              label="Best placement"
              value={passport.bestPlacement ? `#${passport.bestPlacement.placement}` : "—"}
            />
            <StatCard label="Avg brief score" value={passport.avgBriefScore != null ? String(passport.avgBriefScore) : "—"} />
            <StatCard label="Demos shipped" value={String(passport.demosShipped)} />
          </div>

          {(passport.badges ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {passport.badges.map((b) => (
                <span
                  key={b.id}
                  title={b.description}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-status-warning bg-status-warning-soft border border-status-warning rounded-full px-3 py-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" /> {b.label}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {passport.records.map((r) => (
              <RecordCard key={`${r.hackathonId}-${r.teamName}`} record={r} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
