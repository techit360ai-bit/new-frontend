import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  FolderKanban,
  Gauge,
  RefreshCw,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchOrganizationDashboard,
  fetchOrganizationProjects,
  type OrganizationDashboardData,
  type OrganizationProject,
} from "@/lib/api/organization";
import { deriveOrganizationAnalytics } from "@/lib/api/organizationAnalytics";

interface MetricCard {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
}

const EMPTY_DASHBOARD: OrganizationDashboardData = {
  metrics: { activePrograms: 0, hackathons: 0, members: 0, opportunities: 0 },
  projectHealth: [],
  talentActivity: [],
  automation: [],
  activity: [],
};

function EmptyPanel({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 text-center">
      <p className="font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-2 max-w-md text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function SourceError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export function Analytics() {
  const [dashboard, setDashboard] = useState<OrganizationDashboardData | null>(null);
  const [projects, setProjects] = useState<OrganizationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setDashboardError(null);
    setProjectsError(null);

    const [dashboardResult, projectsResult] = await Promise.allSettled([
      fetchOrganizationDashboard(),
      fetchOrganizationProjects(),
    ]);

    if (dashboardResult.status === "fulfilled") {
      setDashboard(dashboardResult.value);
    } else {
      setDashboard(null);
      setDashboardError(
        dashboardResult.reason instanceof Error
          ? dashboardResult.reason.message
          : "Organization dashboard analytics are unavailable.",
      );
    }

    if (projectsResult.status === "fulfilled") {
      setProjects(projectsResult.value);
    } else {
      setProjects([]);
      setProjectsError(
        projectsResult.reason instanceof Error
          ? projectsResult.reason.message
          : "Organization project analytics are unavailable.",
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const analytics = useMemo(
    () => deriveOrganizationAnalytics(dashboard ?? EMPTY_DASHBOARD, projects),
    [dashboard, projects],
  );
  const automation = dashboard?.automation ?? [];
  const latestAutomation = automation[Math.max(0, automation.length - 1)];
  const latestAutomationTotal = latestAutomation
    ? latestAutomation.automated + latestAutomation.manual
    : 0;
  const latestAutomationRate = latestAutomationTotal > 0
    ? Math.round((latestAutomation?.automated ?? 0) / latestAutomationTotal * 100)
    : null;
  const projectValue = (value: string) => projectsError ? "Unavailable" : value;

  const metricStyles = [
    {
      icon: FolderKanban,
      iconClass: "text-[#20C997]",
      iconBackground: "bg-[#20C997]/10 border border-[#20C997]/20",
    },
    {
      icon: Rocket,
      iconClass: "text-emerald-500 dark:text-emerald-400",
      iconBackground: "bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      icon: Gauge,
      iconClass: "text-amber-500 dark:text-amber-400",
      iconBackground: "bg-amber-500/10 border border-amber-500/20",
    },
    {
      icon: Award,
      iconClass: "text-rose-500 dark:text-rose-400",
      iconBackground: "bg-rose-500/10 border border-rose-500/20",
    },
  ];
  const keyMetrics: MetricCard[] = analytics.metrics.map((metric, index) => ({
    ...metric,
    value: projectValue(metric.value),
    detail: projectsError ? "Project source failed" : metric.detail,
    ...metricStyles[index],
  }));

  return (
    <div className="mx-auto max-w-[1800px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Persisted portfolio, operations, and talent analytics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {(dashboardError || projectsError) && (
        <div className="grid gap-3">
          {dashboardError && (
            <SourceError
              title="Live organization dashboard data could not be loaded."
              message={dashboardError}
            />
          )}
          {projectsError && (
            <SourceError
              title="Live organization project data could not be loaded."
              message={projectsError}
            />
          )}
        </div>
      )}

      {loading && !dashboard && projects.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading organization analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {keyMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{metric.label}</p>
                      <p className="mt-2 break-words text-3xl font-black font-mono text-slate-900 dark:text-white">
                        {metric.value}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{metric.detail}</p>
                    </div>
                    <div className={`flex-shrink-0 rounded-xl p-3 ${metric.iconBackground}`}>
                      <Icon className={`h-6 w-6 ${metric.iconClass}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">
                Project Lifecycle Distribution
              </h2>
              {!projectsError && analytics.lifecycle.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.lifecycle} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#888" }} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        width={92}
                        tick={{ fontSize: 12, fill: "#888" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="count" fill="#20C997" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-black/[0.05] dark:border-white/10 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Most Common</p>
                      <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                        {analytics.mostCommonStage}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Total Projects</p>
                      <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                        {analytics.totalProjects}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyPanel
                  title={projectsError ? "Project lifecycle unavailable" : "No project lifecycle data"}
                  detail={
                    projectsError
                      ? "The persisted project source could not be loaded."
                      : "Lifecycle distribution will appear after organization projects are created."
                  }
                />
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Project Health</h2>
              {dashboard && dashboard.projectHealth.length > 0 ? (
                <div className="grid items-center gap-5 sm:grid-cols-2">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={dashboard.projectHealth}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dashboard.projectHealth.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {dashboard.projectHealth.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-4 text-xs font-semibold"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyPanel
                  title={dashboardError ? "Project health unavailable" : "No project health series"}
                  detail={
                    dashboardError
                      ? "The persisted organization dashboard source could not be loaded."
                      : "Project health will appear when the organization dashboard records it."
                  }
                />
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Automation Trends</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Persisted automated and manual operations.</p>
                </div>
                {latestAutomationRate !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-black font-mono text-[#20C997]">{latestAutomationRate}%</p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Latest automation share</p>
                  </div>
                )}
              </div>
              {dashboard && dashboard.automation.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.automation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="automated"
                      stroke="#20C997"
                      strokeWidth={3}
                      name="Automated"
                    />
                    <Line
                      type="monotone"
                      dataKey="manual"
                      stroke="#64748b"
                      strokeWidth={3}
                      name="Manual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel
                  title={dashboardError ? "Automation analytics unavailable" : "No automation trend"}
                  detail={
                    dashboardError
                      ? "The persisted organization dashboard source could not be loaded."
                      : "Automation trends will appear when operational periods are recorded."
                  }
                />
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Talent Activity</h2>
              {dashboard && dashboard.talentActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.talentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="#20C997" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel
                  title={dashboardError ? "Talent analytics unavailable" : "No talent activity series"}
                  detail={
                    dashboardError
                      ? "The persisted organization dashboard source could not be loaded."
                      : "Talent activity will appear when skills and participation are recorded."
                  }
                />
              )}
            </section>
          </div>

          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Analytics Availability</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                These views require persisted historical or financial datasets.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <EmptyPanel
                title="Historical growth unavailable"
                detail="The organization API does not currently expose longitudinal project, revenue, or talent snapshots."
              />
              <EmptyPanel
                title="Execution velocity unavailable"
                detail="No persisted delivery history or weekly velocity series is attached to organization projects."
              />
              <EmptyPanel
                title="Revenue by category unavailable"
                detail="No organization revenue analytics contract is currently available."
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
