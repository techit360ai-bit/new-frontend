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
    iconClass: "text-blue-700",
    iconBackground: "bg-blue-50",
  },
  {
    key: "hackathons",
    label: "Hackathons",
    icon: Trophy,
    iconClass: "text-amber-700",
    iconBackground: "bg-amber-50",
  },
  {
    key: "members",
    label: "Members",
    icon: Users,
    iconClass: "text-emerald-700",
    iconBackground: "bg-emerald-50",
  },
  {
    key: "opportunities",
    label: "Opportunities",
    icon: Rocket,
    iconClass: "text-rose-700",
    iconBackground: "bg-rose-50",
  },
];

function formatTimestamp(value: string): string {
  if (!value) return "No timestamp";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ActivityIcon({ row }: { row: OrganizationActivity }) {
  if (row.type === "success" || row.type === "completed") {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />;
  }
  if (row.type === "warning" || row.type === "risk") {
    return <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />;
  }
  return <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />;
}

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
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
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="mt-2 text-gray-600">Persisted programs, members, opportunities, and operations.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Welcome Back — contextual intelligence surface */}
      <div className="mb-6">
        <WelcomeBack />
      </div>

      <OrganizationIntelligencePanel />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Live organization data could not be loaded.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Loading organization data...
        </div>
      ) : dashboard ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRIC_CARDS.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.key} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {dashboard?.metrics[metric.key] ?? 0}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${metric.iconBackground}`}>
                      <Icon className={`h-6 w-6 ${metric.iconClass}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!error && dashboard && !hasLiveData && (
            <div className="mb-8 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
              <p className="font-medium text-gray-900">No organization activity is recorded yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Programs, members, opportunities, and operational charts will appear as persisted records are created.
              </p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Project Health</h2>
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
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {dashboard.projectHealth.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyPanel>No persisted project health series is available.</EmptyPanel>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Talent Activity</h2>
              {dashboard && dashboard.talentActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.talentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No persisted talent activity series is available.</EmptyPanel>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Automation Trends</h2>
              {dashboard && dashboard.automation.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.automation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="automated" stroke="#2563eb" strokeWidth={3} name="Automated" />
                    <Line type="monotone" dataKey="manual" stroke="#64748b" strokeWidth={3} name="Manual" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No persisted automation trend is available.</EmptyPanel>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Recent Activity</h2>
              {dashboard && dashboard.activity.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.activity.map((row) => (
                    <div key={row.id} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <ActivityIcon row={row} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{row.message}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatTimestamp(row.at)}</p>
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
