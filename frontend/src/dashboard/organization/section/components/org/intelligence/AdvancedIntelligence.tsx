import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, BriefcaseBusiness, Boxes } from "lucide-react";
import {
  fetchOrganizationAlumni,
  fetchOrganizationCohortBenchmarks,
  fetchOrganizationResourceAllocation,
  type OrganizationAlumni,
  type OrganizationBenchmark,
  type OrganizationAllocation,
} from "@/lib/api/organizationIntelligence";

function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-5 py-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Boxes;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm transition-all hover:border-[#20C997]/30">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
        <Icon className="h-5 w-5 text-[#20C997]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ResourceAllocation() {
  const [rows, setRows] = useState<OrganizationAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchOrganizationResourceAllocation()
      .then((data) => setRows(data.allocation))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <Panel title="Resource allocation" icon={Boxes}>
      {loading ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading allocation signals...</p>
      ) : rows.length === 0 ? (
        <Empty>No resource or execution allocation data is available.</Empty>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 10).map((row) => (
            <div
              key={row.projectId}
              className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{row.title}</span>
                <span className="text-xs font-mono font-bold text-[#20C997]">
                  {row.utilization === null ? "—" : `${row.utilization}% utilized`}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {row.resources} resources · {row.completedTasks}/{row.tasks} tasks completed · execution {row.execution ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function AlumniOutcomes() {
  const [rows, setRows] = useState<OrganizationAlumni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizationAlumni()
      .then((data) => setRows(data.outcomes))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Panel title="Alumni outcomes" icon={BriefcaseBusiness}>
      {loading ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading alumni outcomes...</p>
      ) : rows.length === 0 ? (
        <Empty>No completed or graduated startups have outcome records yet.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">{row.title}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {row.status} · funding {row.funding ?? "—"} · jobs {row.jobs ?? "—"} · revenue {row.revenue ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function CohortBenchmarks() {
  const [rows, setRows] = useState<OrganizationBenchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizationCohortBenchmarks()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Panel title="Cross-cohort benchmarks" icon={BarChart3}>
      {loading ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading cohort benchmarks...</p>
      ) : rows.length === 0 ? (
        <Empty>No cohort comparison data is available yet.</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.cohortId}
              className="grid grid-cols-2 gap-3 rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:grid-cols-5"
            >
              <div className="col-span-2 text-xs font-bold text-slate-900 dark:text-white sm:col-span-1">{row.name}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Startups</p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{row.startups}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Health</p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{row.avgHealth ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Progress</p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{row.avgProgress ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Engagement</p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{row.engagement ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
