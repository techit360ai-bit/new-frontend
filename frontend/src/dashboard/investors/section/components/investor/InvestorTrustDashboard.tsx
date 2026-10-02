import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bell,
  Bookmark,
  Building2,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  Flag,
  Github,
  Globe,
  LineChart as LineChartIcon,
  Lock,
  MailCheck,
  NotebookPen,
  Radar,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchInvestorTrustDashboard,
  fetchInvestorTrustAccessRequest,
  fetchInvestorTrustStartups,
  requestInvestorTrustAccess,
  saveInvestorTrustNotes,
  type ApprovedMilestone,
  type EvidenceExplorerItem,
  type InvestorTrustDashboard,
  type InvestorTrustAccessRequest,
  type InvestorTrustNote,
  type InvestorTrustStartupSummary,
  type TrustVerificationState,
  type VerificationItem,
} from '@/lib/api/investorTrust';

const SECTIONS = [
  ['overview', 'Startup Overview'],
  ['summary', 'Trust Summary'],
  ['verification', 'Verification Status'],
  ['founder', 'Founder Overview'],
  ['development', 'Product Development'],
  ['product', 'Product Verification'],
  ['activity', 'Product Activity'],
  ['team', 'Team Verification'],
  ['timeline', 'Evidence Timeline'],
  ['milestones', 'Milestones'],
  ['sources', 'Verification Sources'],
  ['risk', 'Risk & Alerts'],
  ['continuous', 'Continuous Verification'],
  ['readiness', 'Investment Readiness'],
  ['evidence', 'Evidence Explorer'],
  ['notes', 'Investor Notes'],
] as const;

const statusClass: Record<string, string> = {
  verified: 'border-status-success/30 bg-status-success/10 text-status-success',
  pending: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  expired: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  failed: 'border-status-error/30 bg-status-error/10 text-status-error',
  disconnected: 'border-gray-600 bg-surface-inverse-muted text-text-on-inverse-secondary',
  approved: 'border-status-success/30 bg-status-success/10 text-status-success',
};

export function InvestorTrustDashboard() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<InvestorTrustStartupSummary[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(startupId ?? '');
  const [query, setQuery] = useState('');
  const [dashboard, setDashboard] = useState<InvestorTrustDashboard | null>(null);
  const [notes, setNotes] = useState<InvestorTrustNote | null>(null);
  const [saved, setSaved] = useState(false);
  const [accessRequest, setAccessRequest] = useState<InvestorTrustAccessRequest | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchInvestorTrustStartups().then((data) => {
      if (!alive) return;
      setStartups(data.startups);
      setWatchlistIds(data.watchlistStartupIds);
      const initialId = startupId || data.watchlistStartupIds[0] || data.startups[0]?.startupId;
      if (initialId) {
        setSelectedId(initialId);
        if (!startupId) navigate(`/investor/trust/${initialId}`, { replace: true });
      }
    }).catch(() => {
      if (!alive) return;
      setStartups([]);
      setWatchlistIds([]);
    });
    return () => { alive = false; };
  }, [navigate, startupId]);

  useEffect(() => {
    if (startupId && startupId !== selectedId) setSelectedId(startupId);
  }, [selectedId, startupId]);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    fetchInvestorTrustDashboard(selectedId).then((data) => {
      if (!alive) return;
      setDashboard(data);
      setNotes(data.investorNotes);
      setSaved(false);
    }).catch(() => {
      if (!alive) return;
      setDashboard(null);
      setNotes(null);
    });
    fetchInvestorTrustAccessRequest(selectedId).then((data) => { if (alive) setAccessRequest(data.request); }).catch(() => { if (alive) setAccessRequest(null); });
    return () => { alive = false; };
  }, [selectedId]);

  const filteredStartups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const ranked = [...startups].sort((a, b) => {
      const aw = a.watchlistIncluded || watchlistIds.includes(a.startupId) ? 0 : 1;
      const bw = b.watchlistIncluded || watchlistIds.includes(b.startupId) ? 0 : 1;
      return aw - bw || b.confidence - a.confidence;
    });
    if (!term) return ranked;
    return ranked.filter((startup) =>
      [startup.name, startup.industry, startup.country, startup.stage, startup.fundingStage]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, startups, watchlistIds]);

  const watchlistStartups = useMemo(
    () => startups.filter((startup) => startup.watchlistIncluded || watchlistIds.includes(startup.startupId)),
    [startups, watchlistIds],
  );

  const selectedSummary = startups.find((startup) => startup.startupId === selectedId);
  const missingSearch = Boolean(query && filteredStartups.length === 0);

  const selectStartup = (id: string) => {
    setSelectedId(id);
    navigate(`/investor/trust/${id}`);
  };

  const updateNote = (patch: Partial<InvestorTrustNote>) => {
    setNotes((current) => current ? { ...current, ...patch } : current);
    setSaved(false);
  };

  const toggleChecklist = (index: number) => {
    setNotes((current) => {
      if (!current) return current;
      const checklist = current.checklist.map((item, itemIndex) =>
        itemIndex === index ? { ...item, done: !item.done } : item,
      );
      return { ...current, checklist };
    });
    setSaved(false);
  };

  const saveNotes = async () => {
    if (!notes || !selectedId) return;
    const result = await saveInvestorTrustNotes(selectedId, notes);
    setNotes(result.investorNotes);
    setSaved(true);
  };

  const requestAccess = async () => {
    if (!selectedId || accessBusy) return;
    const purpose = window.prompt("Briefly describe why you need additional approved Trust evidence.", "Investment due diligence");
    if (purpose === null) return;
    setAccessBusy(true);
    try {
      const result = await requestInvestorTrustAccess(selectedId, purpose);
      setAccessRequest(result.request);
    } finally {
      setAccessBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-inverse">
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-status-success/20 bg-status-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-status-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trust Engine
            </div>
            <h1 className="text-3xl font-bold text-white">Investor Trust Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-on-inverse-muted">
              Verified metadata, operational evidence, freshness, and private diligence notes for every startup in your pipeline.
            </p>
          </div>
          <div className="hidden rounded-lg border border-border-inverse bg-background-inverse/60 px-4 py-3 text-right lg:block">
            <p className="text-xs uppercase tracking-wider text-text-on-inverse-disabled">Privacy Contract</p>
            <p className="mt-1 text-sm font-semibold text-status-success">Investor-safe metadata only</p>
            <p className="text-xs text-text-on-inverse-disabled">No raw payloads, code, customers, tokens, or documents</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="border-b border-border-inverse bg-surface-inverse p-5 xl:border-b-0 xl:border-r">
          <div className="mb-4">
            <label htmlFor="trust-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-on-inverse-disabled">
              Search Startups
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-on-inverse-disabled" />
              <input
                id="trust-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, sector, country..."
                className="w-full rounded-lg border border-border-inverse bg-background-inverse py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-text-muted focus:border-status-success focus:outline-none"
              />
            </div>
            <p className="mt-2 text-xs text-text-on-inverse-disabled">
              Watchlist startups load automatically; search also covers startups outside your watchlist.
            </p>
          </div>

          <div className="mb-5 rounded-lg border border-status-info/20 bg-status-info/10 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-status-info">
              <Bookmark className="h-3.5 w-3.5" />
              Watchlist Auto-Included
            </div>
            <p className="mt-1 text-sm text-white">{watchlistStartups.length} startups</p>
            <p className="text-xs text-text-on-inverse-muted">Any startup on your watchlist appears here automatically.</p>
          </div>

          <div className="space-y-2">
            {missingSearch && (
              <div className="rounded-lg border border-status-warning/20 bg-status-warning/10 p-3">
                <p className="text-sm font-semibold text-status-warning">No startup found</p>
                <p className="mt-1 text-xs text-text-on-inverse-muted">Search the verified directory by company, sector, country, stage, or funding stage.</p>
              </div>
            )}
            {filteredStartups.map((startup) => (
              <button
                key={startup.startupId}
                onClick={() => selectStartup(startup.startupId)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  selectedId === startup.startupId
                    ? 'border-status-success/40 bg-status-success/10'
                    : 'border-border-inverse bg-surface-inverse hover:border-border-inverse-strong hover:bg-background-inverse'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-inverse-muted font-mono text-xs font-bold text-white">
                    {startup.logoText}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{startup.name}</p>
                    <p className="truncate text-xs text-text-on-inverse-disabled">{startup.industry} · {startup.country}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={healthText(startup.verificationHealth)}>{healthLabel(startup.verificationHealth)}</span>
                  <span className="font-mono text-text-on-inverse-muted">{startup.confidence}%</span>
                </div>
                {startup.watchlistIncluded && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded bg-status-info/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-info">
                    <Bookmark className="h-3 w-3" />
                    Watchlist
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 hidden space-y-1 xl:block">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded-md px-3 py-2 text-xs font-medium text-text-on-inverse-disabled hover:bg-background-inverse hover:text-text-on-inverse-secondary"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        <main className="overflow-y-auto p-5 lg:p-8">
          {!dashboard ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border-inverse bg-surface-inverse text-text-on-inverse-muted">
              Loading investor Trust dashboard...
            </div>
          ) : (
            <div className="space-y-6">
              <Hero dashboard={dashboard} selectedSummary={selectedSummary} />
              <TrustSummary dashboard={dashboard} />
              <VerificationPanel items={dashboard.verificationItems} />
              <FounderOverview dashboard={dashboard} />
              <ProductDevelopment dashboard={dashboard} />
              <ProductAndActivity dashboard={dashboard} />
              <TeamTimeline dashboard={dashboard} />
              <MilestonesAndSources dashboard={dashboard} />
              <RiskContinuousReadiness dashboard={dashboard} />
              <EvidenceExplorer items={dashboard.evidenceExplorer} />
            </div>
          )}
        </main>

        <aside className="border-t border-border-inverse bg-surface-inverse p-5 xl:border-l xl:border-t-0">
          {dashboard && notes && (
            <div className="space-y-5">
              <Panel id="notes" title="Investor Notes" icon={NotebookPen}>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border-inverse bg-background-inverse p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-on-inverse-disabled">
                      <Lock className="h-3.5 w-3.5" />
                      Private to investor
                    </div>
                    <textarea
                      value={notes.note}
                      onChange={(event) => updateNote({ note: event.target.value })}
                      className="min-h-24 w-full resize-none rounded-md border border-border-inverse bg-surface-inverse p-3 text-sm text-text-on-inverse-secondary focus:border-status-success focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-on-inverse-disabled">Internal Rating</label>
                    <select
                      value={notes.internalRating}
                      onChange={(event) => updateNote({ internalRating: event.target.value as InvestorTrustNote['internalRating'] })}
                      className="w-full rounded-lg border border-border-inverse bg-surface-inverse px-3 py-2 text-sm text-white focus:border-status-success focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="watch">Watch</option>
                      <option value="priority">Priority</option>
                      <option value="pass">Pass</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-on-inverse-disabled">Follow-Up Reminder</label>
                    <input
                      value={notes.followUpReminder}
                      onChange={(event) => updateNote({ followUpReminder: event.target.value })}
                      className="w-full rounded-lg border border-border-inverse bg-surface-inverse px-3 py-2 text-sm text-white focus:border-status-success focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-on-inverse-disabled">Due Diligence Checklist</p>
                    {notes.checklist.map((item, index) => (
                      <label key={item.item} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-inverse bg-surface-inverse p-2 text-sm text-text-on-inverse-secondary">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklist(index)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <span className={item.done ? 'text-text-on-inverse-disabled line-through' : ''}>{item.item}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={saveNotes}
                    className="w-full rounded-lg bg-status-success px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
                  >
                    {saved ? 'Notes Saved' : 'Save Private Notes'}
                  </button>
                </div>
              </Panel>

              <Panel id="privacy" title="Privacy Guardrails" icon={ShieldCheck}>
                <div className="space-y-2 text-sm">
                  <PrivacyRow label="Metadata only" ok={dashboard.privacy.metadataOnly} />
                  <PrivacyRow label="Approved evidence only" ok={dashboard.privacy.approvedEvidenceOnly} />
                  <PrivacyRow label="Raw payloads exposed" ok={!dashboard.privacy.rawPayloadsExposed} invertLabel />
                  <PrivacyRow label="Customer data exposed" ok={!dashboard.privacy.customerDataExposed} invertLabel />
                  <PrivacyRow label="Source code exposed" ok={!dashboard.privacy.sourceCodeExposed} invertLabel />
                  <PrivacyRow label="Notes founder-visible" ok={!dashboard.privacy.founderVisible} invertLabel />
                </div>
              </Panel>

              <Panel id="quick-links" title="Related Investor Tools" icon={ExternalLink}>
                <div className="space-y-2">
                  <button type="button" disabled={accessBusy || accessRequest?.status === 'pending' || accessRequest?.status === 'approved'} onClick={() => void requestAccess()} className="w-full rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-left text-sm font-semibold text-status-success disabled:cursor-not-allowed disabled:opacity-60">
                    {accessBusy ? 'Submitting request...' : accessRequest?.status === 'pending' ? 'Access request pending' : accessRequest?.status === 'approved' ? 'Additional access approved' : accessRequest?.status === 'rejected' ? 'Request access again' : 'Request additional Trust access'}
                  </button>
                  <LinkButton to={`/investor/risk-radar/${dashboard.startup.startupId}`} label="Risk Radar" />
                  <LinkButton to={`/investor/data-room/${dashboard.startup.startupId}`} label="Data Room" />
                  <LinkButton to={`/investor/deal-room/${dashboard.startup.startupId}`} label="Deal Room" />
                  <LinkButton to="/investor/watchlist" label="Watchlist" />
                </div>
              </Panel>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Hero({ dashboard, selectedSummary }: { dashboard: InvestorTrustDashboard; selectedSummary?: InvestorTrustStartupSummary }) {
  const startup = dashboard.startup;
  return (
    <section id="overview" className="rounded-lg border border-border-inverse bg-surface-inverse p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-border-inverse-strong bg-background-inverse font-mono text-xl font-bold text-white">
            {startup.logoText}
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{startup.name}</h2>
              <StatusBadge status="verified" label={startup.verifiedStatus} />
              {startup.watchlistIncluded && <StatusPill icon={Bookmark} label="On Watchlist" color="blue" />}
            </div>
            <div className="grid gap-x-6 gap-y-2 text-sm text-text-on-inverse-muted sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Industry" value={startup.industry} />
              <Info label="Country" value={startup.country} />
              <Info label="Founded" value={startup.founded} />
              <Info label="Stage" value={startup.stage} />
              <Info label="Funding" value={startup.fundingStage} />
              <Info label="Website" value={startup.website} />
              <Info label="Last Verified" value={startup.lastVerified} />
              <Info label="Trust Trend" value={selectedSummary?.trustTrend ?? startup.trustTrend} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-status-success/20 bg-status-success/10 p-4 lg:min-w-56">
          <p className="text-xs uppercase tracking-wider text-status-success">Overall Trust Status</p>
          <p className="mt-1 text-3xl font-bold font-mono text-white">{startup.confidence}%</p>
          <p className="text-sm text-status-success">{startup.overallStatus}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {dashboard.badges.map((badge) => (
          <a
            key={badge.badgeType}
            href={`#verification`}
            className="inline-flex items-center gap-1.5 rounded-full border border-status-success/20 bg-status-success/10 px-3 py-1.5 text-xs font-semibold text-status-success hover:bg-status-success/15"
            title={`${badge.source} · ${badge.confidence}% confidence`}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {badge.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function TrustSummary({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  const summary = dashboard.trustSummary;
  return (
    <section id="summary" className="grid gap-4 md:grid-cols-5">
      <SummaryCard label="Overall Status" value={summary.overallStatus} icon={ShieldCheck} color="emerald" />
      <SummaryCard label="Confidence" value={`${summary.verificationConfidence}%`} icon={BadgeCheck} color="blue" />
      <SummaryCard label="Freshness" value={summary.verificationFreshness} icon={Clock3} color="cyan" />
      <SummaryCard label="Evidence Sources" value={`${summary.evidenceSources} Connected`} icon={Database} color="purple" />
      <SummaryCard label="Health" value={summary.verificationHealth} icon={Activity} color="emerald" />
    </section>
  );
}

function VerificationPanel({ items }: { items: VerificationItem[] }) {
  return (
    <Panel id="verification" title="Verification Status" icon={ClipboardCheck}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={`${item.source}-${item.provider}`} className="rounded-lg border border-border-inverse bg-background-inverse p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-xs text-text-on-inverse-disabled">{item.provider}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Last Updated" value={item.lastUpdated} />
              <InfoRow label="Source" value={item.source} />
              <InfoRow label="Confidence" value={`${item.confidence}%`} />
              <InfoRow label="Freshness" value={item.freshness} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FounderOverview({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  const founder = dashboard.founderOverview;
  return (
    <Panel id="founder" title="Founder Overview" icon={UserCheck}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Founders" value={founder.founders} />
        <Metric label="Profiles Connected" value={founder.professionalProfilesConnected} />
        <Metric label="Years Building" value={founder.yearsBuildingStartup} />
        <Metric label="Response Rate" value={founder.responseRate} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <BooleanCard label="GitHub Connected" ok={founder.githubConnected} icon={Github} />
        <BooleanCard label="LinkedIn Connected" ok={founder.linkedinConnected} icon={Users} />
        <BooleanCard label="Company Email Verified" ok={founder.companyEmailVerified} icon={MailCheck} />
      </div>
      <p className="mt-4 rounded-lg border border-border-inverse bg-background-inverse/50 p-3 text-sm text-text-on-inverse-muted">
        Professional metadata only. This surface never exposes government IDs, phone numbers, personal addresses, or private documents.
      </p>
    </Panel>
  );
}

function ProductDevelopment({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  const development = dashboard.productDevelopment;
  return (
    <Panel id="development" title="Product Development" icon={Github}>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Development Status" value={development.developmentStatus} />
          <Metric label="Recent Activity" value={development.recentActivity} />
          <Metric label="Contributors Verified" value={development.contributorsVerified} />
          <Metric label="Deployment Frequency" value={development.deploymentFrequency} />
          <Metric label="Latest Deployment" value={development.latestDeployment} />
          <Metric label="Consistency" value={development.developmentConsistency} />
        </div>
        <div className="h-64 rounded-lg border border-border-inverse bg-background-inverse p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <LineChartIcon className="h-4 w-4 text-status-success" />
            Activity Trend
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={development.activityTrend}>
              <defs>
                <linearGradient id="activity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="label" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }} />
              <Area type="monotone" dataKey="activity" stroke="#10b981" fill="url(#activity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-on-inverse-disabled">Repository status uses aggregate metadata only; repositories and source code are not exposed.</p>
    </Panel>
  );
}

function ProductAndActivity({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel id="product" title="Product Verification" icon={Server}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Product Status" value={dashboard.productVerification.productStatus} />
          <BooleanCard label="Website Verified" ok={dashboard.productVerification.websiteVerified} icon={Globe} />
          <BooleanCard label="Deployments Verified" ok={dashboard.productVerification.deploymentsVerified} icon={Server} />
          <Metric label="Latest Deployment" value={dashboard.productVerification.latestDeployment} />
          <Metric label="Freshness" value={dashboard.productVerification.verificationFreshness} />
          <Metric label="Platforms" value={dashboard.productVerification.supportedPlatforms.join(', ')} />
        </div>
      </Panel>
      <Panel id="activity" title="Product Activity" icon={Activity}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Monthly Active Users" value={dashboard.productActivity.monthlyActiveUsers} />
          <Metric label="Daily Active Users" value={dashboard.productActivity.dailyActiveUsers} />
          <Metric label="Growth Trend" value={dashboard.productActivity.growthTrend} />
          <Metric label="Retention" value={dashboard.productActivity.retention} />
          <Metric label="Data Freshness" value={dashboard.productActivity.dataFreshness} />
        </div>
        <p className="mt-4 text-sm text-text-on-inverse-disabled">Aggregate metrics only. No user identities, customer emails, lists, or event logs are exposed.</p>
      </Panel>
    </div>
  );
}

function TeamTimeline({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  const team = dashboard.teamOverview;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel id="team" title="Team Verification" icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Team Members" value={team.teamMembers} />
          <Metric label="Verified Members" value={team.verifiedMembers} />
          <Metric label="Pending Verification" value={team.pendingVerification} />
          <Metric label="Average Verification Age" value={team.averageVerificationAge} />
          <Metric label="Technical Contributors" value={team.technicalContributors} />
          <BooleanCard label="Active This Month" ok={team.activeThisMonth} icon={Activity} />
        </div>
      </Panel>
      <Panel id="timeline" title="Immutable Evidence Timeline" icon={CalendarClock}>
        <div className="space-y-4">
          {dashboard.timeline.map((event, index) => (
            <div key={event.id} className="relative flex gap-3">
              {index < dashboard.timeline.length - 1 && <div className="absolute left-2 top-6 h-full w-px bg-surface-inverse-muted" />}
              <CheckCircle className="relative z-10 mt-0.5 h-4 w-4 flex-shrink-0 text-status-success" />
              <div>
                <p className="text-sm font-semibold text-white">{event.title}</p>
                <p className="text-xs text-text-on-inverse-disabled">{event.when} · {event.source} · {event.confidence}% confidence</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MilestonesAndSources({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel id="milestones" title="Approved Milestones" icon={Flag}>
        <div className="space-y-3">
          {dashboard.milestones.map((milestone) => (
            <MilestoneRow key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </Panel>
      <Panel id="sources" title="Verification Sources" icon={Database}>
        <div className="space-y-3">
          {dashboard.verificationSources.map((source) => (
            <div key={source.label} className="flex items-center justify-between rounded-lg border border-border-inverse bg-background-inverse p-3">
              <div>
                <p className="text-sm font-semibold text-white">{source.label}</p>
                <p className="text-xs text-text-on-inverse-disabled">{source.origin} · {source.lastSync}</p>
              </div>
              <StatusBadge status={source.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RiskContinuousReadiness({ dashboard }: { dashboard: InvestorTrustDashboard }) {
  const risk = dashboard.riskStatus;
  const continuous = dashboard.continuousVerification;
  const readiness = dashboard.investmentReadiness;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel id="risk" title="Risk & Alerts" icon={Radar}>
        <div className="space-y-3">
          <Metric label="Verification Freshness" value={risk.verificationFreshness} />
          <Metric label="Missing Integrations" value={risk.missingIntegrations} />
          <Metric label="Expired Verification" value={risk.expiredVerification} />
          <Metric label="Recent Failures" value={risk.recentVerificationFailures} />
          <Metric label="Trust Trend" value={risk.trustTrend} />
          {risk.issues.map((issue) => (
            <div key={issue.title} className="rounded-lg border border-status-warning/20 bg-status-warning/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-warning">
                <AlertTriangle className="h-4 w-4" />
                {issue.title}
              </div>
              <p className="mt-1 text-xs text-text-on-inverse-muted">{issue.detail} · last sync {issue.lastSync}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel id="continuous" title="Continuous Verification" icon={Bell}>
        <div className="space-y-3">
          <Metric label="Status" value={continuous.status} />
          <Metric label="Last Verification" value={continuous.lastVerification} />
          <Metric label="Next Verification" value={continuous.nextVerification} />
          <Metric label="Connected Services" value={continuous.connectedServices} />
          <Metric label="Success Rate" value={continuous.successRate} />
        </div>
      </Panel>
      <Panel id="readiness" title="Investment Readiness Snapshot" icon={FileCheck2}>
        <div className="space-y-3">
          <BooleanRow label="Founder Verified" ok={readiness.founderVerified} />
          <BooleanRow label="Organization Verified" ok={readiness.organizationVerified} />
          <BooleanRow label="Product Live" ok={readiness.productLive} />
          <BooleanRow label="Development Active" ok={readiness.developmentActive} />
          <Metric label="Team Verified" value={`${readiness.teamVerifiedPct}%`} />
          <Metric label="Operational Evidence" value={readiness.operationalEvidence} />
          <Metric label="Freshness" value={readiness.verificationFreshness} />
        </div>
      </Panel>
    </div>
  );
}

function EvidenceExplorer({ items }: { items: EvidenceExplorerItem[] }) {
  return (
    <Panel id="evidence" title="Evidence Explorer" icon={Search}>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border-inverse bg-background-inverse p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.metric}</p>
                <p className="text-xs text-text-on-inverse-disabled">{item.evidenceSource}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Verified" value={item.verifiedAt} />
              <InfoRow label="Confidence" value={`${item.confidence}%`} />
            </div>
            <p className="mt-3 text-sm text-text-on-inverse-muted">{item.details}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ id, title, icon: Icon, children }: { id: string; title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <section id={id} className="rounded-lg border border-border-inverse bg-surface-inverse p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-status-success" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: ComponentType<{ className?: string }>; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'border-status-success/20 bg-status-success/10 text-status-success',
    blue: 'border-status-info/20 bg-status-info/10 text-status-info',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    purple: 'border-status-pending/20 bg-status-pending/10 text-status-pending',
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <Icon className="mb-3 h-5 w-5" />
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border-inverse bg-background-inverse p-3">
      <p className="text-xs text-text-on-inverse-disabled">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function BooleanCard({ label, ok, icon: Icon }: { label: string; ok: boolean; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className={`rounded-lg border p-3 ${ok ? 'border-status-success/20 bg-status-success/10' : 'border-border-inverse bg-background-inverse'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${ok ? 'text-status-success' : 'text-text-on-inverse-disabled'}`} />
        <p className="text-sm font-semibold text-white">{label}</p>
      </div>
      <p className={`mt-1 text-xs ${ok ? 'text-status-success' : 'text-text-on-inverse-disabled'}`}>{ok ? 'Verified' : 'Not verified'}</p>
    </div>
  );
}

function BooleanRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-inverse bg-background-inverse p-3 text-sm">
      <span className="text-text-on-inverse-muted">{label}</span>
      {ok ? <CheckCircle className="h-4 w-4 text-status-success" /> : <XCircle className="h-4 w-4 text-text-on-inverse-disabled" />}
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: ApprovedMilestone }) {
  return (
    <div className="rounded-lg border border-border-inverse bg-background-inverse p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{milestone.title}</p>
          <p className="text-xs text-text-on-inverse-disabled">{milestone.evidence}</p>
        </div>
        <StatusBadge status={milestone.status === 'verified' ? 'verified' : 'pending'} label={milestone.status === 'verified' ? 'Verified' : 'Pending Review'} />
      </div>
      {(milestone.approvalDate || milestone.verifier) && (
        <p className="mt-2 text-xs text-text-on-inverse-disabled">{milestone.approvalDate} · {milestone.verifier}</p>
      )}
    </div>
  );
}

function StatusBadge({ status, label }: { status: TrustVerificationState | 'approved'; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[status] ?? statusClass.verified}`}>
      {label ?? status.replace('_', ' ')}
    </span>
  );
}

function StatusPill({ icon: Icon, label, color }: { icon: ComponentType<{ className?: string }>; label: string; color: 'blue' | 'emerald' }) {
  const classes = color === 'blue' ? 'border-status-info/20 bg-status-info/10 text-status-info' : 'border-status-success/20 bg-status-success/10 text-status-success';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider text-text-muted">{label}</span>
      <p className="truncate text-sm font-medium text-text-on-inverse-secondary">{value ?? '—'}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-on-inverse-disabled">{label}</span>
      <span className="text-right font-medium text-text-on-inverse-secondary">{value}</span>
    </div>
  );
}

function PrivacyRow({ label, ok, invertLabel }: { label: string; ok: boolean; invertLabel?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-inverse bg-background-inverse p-2">
      <span className="text-text-on-inverse-muted">{label}</span>
      <span className={ok ? 'text-status-success' : 'text-status-error'}>{invertLabel ? (ok ? 'No' : 'Yes') : (ok ? 'Yes' : 'No')}</span>
    </div>
  );
}

function LinkButton({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-lg border border-border-inverse bg-background-inverse px-3 py-2 text-sm text-text-on-inverse-secondary hover:border-border-inverse-strong hover:text-white">
      {label}
      <ChevronRight className="h-4 w-4 text-text-muted" />
    </Link>
  );
}

function healthLabel(health: string) {
  if (health === 'needs_attention') return 'Needs attention';
  return health.charAt(0).toUpperCase() + health.slice(1);
}

function healthText(health: string) {
  if (health === 'excellent') return 'text-status-success';
  if (health === 'good') return 'text-status-info';
  return 'text-status-warning';
}
