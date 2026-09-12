import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, Briefcase, DollarSign, Download, Rocket, TrendingUp } from "lucide-react";
import { fetchImpact, type ImpactReport } from "@/lib/api/organization";

const TEMPLATES = [
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "program-end", label: "Program-end" },
];

const PIE_COLORS = ["#20C997", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function ImpactReporting() {
  const [template, setTemplate] = useState("quarterly");
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchImpact(template));
    } catch (loadError) {
      setReport(null);
      setError(loadError instanceof Error ? loadError.message : "Impact report is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [template]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = report
    ? [
        { label: "Startups", value: report.metrics.startups, icon: Briefcase, tone: "text-[#20C997]", bg: "bg-[#20C997]/10" },
        { label: "Products Launched", value: report.metrics.productsLaunched, icon: Rocket, tone: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total MRR", value: `$${report.metrics.totalMrr.toLocaleString()}`, icon: DollarSign, tone: "text-amber-600", bg: "bg-amber-50" },
        { label: "Jobs Supported", value: report.metrics.jobs, icon: TrendingUp, tone: "text-rose-600", bg: "bg-rose-50" },
      ]
    : [];

  const hasData = report && report.metrics.startups > 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <select
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} report
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!hasData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !report ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Loading impact report...
        </div>
      ) : hasData ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{card.label}</p>
                      <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${card.bg}`}>
                      <Icon className={`h-6 w-6 ${card.tone}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Stage progression</h2>
              {report!.stageProgression.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={report!.stageProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#20C997" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No stage data yet.</EmptyPanel>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Industry breakdown</h2>
              {report!.industryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={report!.industryBreakdown} cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} dataKey="value">
                      {report!.industryBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No industry data yet.</EmptyPanel>
              )}
            </section>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Metrics are aggregated from your portfolio&apos;s current records. Users-acquired and
            milestone metrics will appear once those fields are tracked.
          </p>
        </>
      ) : (
        <EmptyPanel>No portfolio data yet. Create organization projects to generate an impact report.</EmptyPanel>
      )}
    </div>
  );
}
