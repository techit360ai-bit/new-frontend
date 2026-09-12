import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Rocket,
  Trophy,
  Users,
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
  type OrganizationActivity,
  type OrganizationDashboardData,
} from "@/lib/api/organization";
import { WelcomeBack } from "@/components/WelcomeBack";
import { OrganizationIntelligencePanel } from "./OrganizationIntelligencePanel";

interface MetricCard {
  key: keyof OrganizationDashboardData["metrics"];
  label: string;
  icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
}

const METRIC_CARDS: MetricCard[] = [
  {
    key: "activePrograms",
    label: "Active Programs",
    icon: GraduationCap,
    iconClass: "text-[#20C997]",
    iconBackground: "bg-[#20C997]/10 border border-[#20C997]/20",
  },
  {
    key: "hackathons",
    label: "Hackathons",
    icon: Trophy,
    iconClass: "text-amber-500 dark:text-amber-400",
    iconBackground: "bg-amber-500/10 border border-amber-500/20",
  },
  {
    key: "members",
    label: "Members",
    icon: Users,
    iconClass: "text-emerald-500 dark:text-emerald-400",
    iconBackground: "bg-emerald-500/10 border border-emerald-500/20",
  },
  {
    key: "opportunities",
    label: "Opportunities",
    icon: Rocket,
    iconClass: "text-rose-500 dark:text-rose-400",
    iconBackground: "bg-rose-500/10 border border-rose-500/20",
  },
];

function formatTimestamp(value: string): string {
  if (!value) return "No timestamp";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ActivityIcon({ row }: { row: OrganizationActivity }) {
  if (row.type === "success" || row.type === "completed") {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />;
  }
  if (row.type === "warning" || row.type === "risk") {
    return <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />;
  }
  return <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#20C997]" />;
}

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<OrganizationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await fetchOrganizationDashboard());
    } catch (loadError) {
      setDashboard(null);
      setError(loadError instanceof Error ? loadError.message : "Organization dashboard is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const hasLiveData = useMemo(() => {
    if (!dashboard) return false;
    return Object.values(dashboard.metrics).some((value) => value > 0)
      || dashboard.projectHealth.length > 0
      || dashboard.talentActivity.length > 0
      || dashboard.automation.length > 0
      || dashboard.activity.length > 0;
  }, [dashboard]);

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Organization Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Persisted programs, members, opportunities, and operational telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#20C997]/40 hover:text-[#20C997] transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Welcome Back — contextual intelligence surface */}
      <div>
        <WelcomeBack />
      </div>

      <OrganizationIntelligencePanel />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-bold">Live organization data could not be loaded.</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading organization data...
        </div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRIC_CARDS.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-3xl font-black font-mono text-slate-900 dark:text-white">
                        {dashboard?.metrics[metric.key] ?? 0}
                      </p>
                    </div>
                    <div className={`rounded-xl p-3 ${metric.iconBackground}`}>
                      <Icon className={`h-6 w-6 ${metric.iconClass}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!error && dashboard && !hasLiveData && (
            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-8 text-center">
              <p className="font-bold text-slate-900 dark:text-white">No organization activity is recorded yet.</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Programs, members, opportunities, and operational charts will appear as persisted records are created.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Project Health</h2>
              {dashboard && dashboard.projectHealth.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={dashboard.projectHealth}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
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
                  <div className="mt-4 space-y-2">
                    {dashboard.projectHealth.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 text-xs font-semibold">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyPanel>No persisted project health series is available.</EmptyPanel>
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Talent Activity</h2>
              {dashboard && dashboard.talentActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.talentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
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
                <EmptyPanel>No persisted talent activity series is available.</EmptyPanel>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Automation Trends</h2>
              {dashboard && dashboard.automation.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.automation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="automated" stroke="#20C997" strokeWidth={3} name="Automated" />
                    <Line type="monotone" dataKey="manual" stroke="#64748b" strokeWidth={3} name="Manual" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No persisted automation trend is available.</EmptyPanel>
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              {dashboard && dashboard.activity.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.activity.map((row) => (
                    <div key={row.id} className="flex items-start gap-3 border-b border-black/[0.05] dark:border-white/10 pb-4 last:border-0 last:pb-0">
                      <ActivityIcon row={row} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{row.message}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatTimestamp(row.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel>No persisted organization activity is available.</EmptyPanel>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
