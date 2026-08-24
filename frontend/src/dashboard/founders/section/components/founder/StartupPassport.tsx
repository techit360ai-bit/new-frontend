import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Award, Trophy, Users } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";
import { derivePassport, type PassportRecord } from "@/dashboard/_shared/passport/passport";
import { momentumColor } from "@/dashboard/_shared/hackathon/momentum";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  );
}

function RecordCard({ record }: { record: PassportRecord }) {
  const teammates = record.teammates ?? [];
  const briefColor = record.briefOverall != null ? momentumColor(record.briefOverall) : null;
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 truncate">{record.teamName}</h4>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{record.role}</p>
        </div>
        {record.completed && record.placement != null ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            #{record.placement} of {record.cohortSize}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 capitalize">
            {record.stage.replace("-", " ")}
          </span>
        )}
      </div>

      {record.briefOverall != null && briefColor && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700">Brief score</span>
            <span className={`text-xs font-semibold ${briefColor.text}`}>{record.briefOverall}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className={`h-1.5 rounded-full ${briefColor.bar}`} style={{ width: `${record.briefOverall}%` }} />
          </div>
        </div>
      )}

      {record.topJudgeComment && (
        <p className="text-xs text-slate-600 italic mt-3">“{record.topJudgeComment}”</p>
      )}

      {teammates.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
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
    <section className="border border-slate-200 rounded-xl p-6 bg-white">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-slate-900">Startup Passport</h2>
        <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
          Visible to investors
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-5">Your verified hackathon track record across events.</p>

      {!passport.hasActivity ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <Award className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5"
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
