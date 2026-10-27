import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Users, Clock, CheckCircle2, TrendingUp, RefreshCw } from "lucide-react";
import { fetchOpportunityAdminMetrics, type OpportunityAdminMetricsData } from "@/lib/api/opportunityAdminAnalytics";

export default function OpportunityAdminMetrics() {
  const [metrics, setMetrics] = useState<OpportunityAdminMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchOpportunityAdminMetrics()
      .then((data) => {
        if (alive) setMetrics(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 border border-dashed border-border-strong rounded-xl text-center">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-violet-600 mb-2" />
        <p className="text-xs text-text-muted">Loading compliance & fairness metrics...</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-surface-primary rounded-2xl border border-border-strong p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Opportunity Compliance & Fairness Telemetry</h2>
          <p className="text-xs text-text-muted">Section 20 administrative tracking for KYC, disputes, fairness, verification backlog, and execution outcomes.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
          Trust Engine Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="border border-border-strong rounded-xl p-4 bg-background-primary">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-semibold text-text-secondary">KYC Completion (Paid Gigs)</h3>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.kycCompletionRate}%</p>
          <p className="text-xs text-text-muted mt-1">{metrics.approvedKycCount} approved • {metrics.pendingKycCount} pending review</p>
        </div>

        {/* Metric 2 */}
        <div className="border border-border-strong rounded-xl p-4 bg-background-primary">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-semibold text-text-secondary">Disputes & Disagreements</h3>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.substantiatedDisputes} Substantiated</p>
          <p className="text-xs text-text-muted mt-1">{metrics.pendingDisputes} pending investigation / {metrics.totalDisputes} total</p>
        </div>

        {/* Metric 3 */}
        <div className="border border-border-strong rounded-xl p-4 bg-background-primary">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-semibold text-text-secondary">Exposure Fairness Score</h3>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.exposureFairnessScore}/100</p>
          <p className="text-xs text-text-muted mt-1">Anti-monopoly index: {metrics.monopolyConcentrationIndex}</p>
        </div>

        {/* Metric 4 */}
        <div className="border border-border-strong rounded-xl p-4 bg-background-primary">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-text-secondary">Verification Turnaround</h3>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.averageVerificationTimeHours} hours avg</p>
          <p className="text-xs text-text-muted mt-1">{metrics.pendingReviewBacklog} items in review backlog</p>
        </div>

        {/* Metric 5 */}
        <div className="border border-border-strong rounded-xl p-4 bg-background-primary">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-semibold text-text-secondary">Successful Completions</h3>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.successfulCompletions}</p>
          <p className="text-xs text-text-muted mt-1">Recorded in Execution Reputation Graph</p>
        </div>
      </div>
    </div>
  );
}
