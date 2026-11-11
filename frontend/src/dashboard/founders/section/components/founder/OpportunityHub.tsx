import { useEffect, useMemo, useState } from "react";
import { Search, Plus, CheckCircle2, Clock, FileText, Shield, AlertCircle, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Opportunity, OpportunityType, OpportunityStatus } from "@/dashboard/_shared/opportunities/types";
import { fetchFounderOpportunityCatalog, createOpportunity, fetchEngagements, type Engagement, type Deliverable } from "@/lib/api/opportunities";
import { OpportunityCard } from "./OpportunityCard";
import { useAuth } from "@/contexts/AuthContext";

type TypeFilter = "all" | OpportunityType;
type StatusFilter = "all" | OpportunityStatus | "engagements";

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  hackathon: "Hackathons",
  program: "Programs",
  funding: "Funding",
  event: "Events",
  collaboration: "Collaboration calls",
};

const STATUS_RANK: Record<OpportunityStatus, number> = { open: 0, "closing-soon": 1, closed: 2 };

export default function OpportunityHub() {
  const { profile, activeContext } = useAuth();
  const currentRole = activeContext?.role || profile?.activeRole || profile?.role || "explorer";
  const isExplorerOrUser = currentRole === "explorer";

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");

  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<string>("collaboration");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newSkills, setNewSkills] = useState("React, Node, TypeScript");
  const [newCompType, setNewCompType] = useState("paid-gig");
  const [newCompensation, setNewCompensation] = useState("150000");
  const [newDeliverableTitle, setNewDeliverableTitle] = useState("MVP Landing Page");
  const [newDeliverableDue, setNewDeliverableDue] = useState("2026-11-15");

  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [opps, engs] = await Promise.all([
        fetchFounderOpportunityCatalog(),
        fetchEngagements(),
      ]);
      setOpportunities(opps);
      setEngagements(engs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opportunities could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handlePostClick = () => {
    if (isExplorerOrUser) {
      toast.error("Explorers and users cannot post opportunities. Please switch to a Founder, Collaborator, Investor, or Organization role.");
      return;
    }
    setShowPostModal(true);
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Please fill in title and description");
      return;
    }
    setPosting(true);
    try {
      await createOpportunity({
        title: newTitle.trim(),
        description: newDescription.trim(),
        type: newType,
        category: newCategory,
        requiredSkills: newSkills.split(",").map((s) => s.trim()).filter(Boolean),
        compensationType: newCompType,
        compensationMin: Number(newCompensation) || 0,
        compensationCurrency: "NGN",
        isStartupListing: currentRole === "founder",
        deliverables: newDeliverableTitle ? [{ title: newDeliverableTitle, description: newDeliverableTitle, dueDate: newDeliverableDue }] : [],
        role: newType === "collaboration" ? "Collaborator" : undefined,
      });
      toast.success("Opportunity published successfully (Verified & Free for startup listings)");
      setShowPostModal(false);
      setNewTitle("");
      setNewDescription("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish opportunity");
    } finally {
      setPosting(false);
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === "engagements") return [];
    const q = search.trim().toLowerCase();
    return opportunities
      .filter((o) => typeFilter === "all" || o.type === typeFilter)
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!q) return true;
        return (
          o.title.toLowerCase().includes(q) ||
          o.organizer.name.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (r !== 0) return r;
        return new Date(a.applyDeadline).getTime() - new Date(b.applyDeadline).getTime();
      });
  }, [opportunities, typeFilter, statusFilter, search]);

  const featured: Opportunity | null = useMemo(() => {
    return filtered.find((o) => o.featured && o.status === "open") ?? filtered.find((o) => o.status === "open") ?? filtered[0] ?? null;
  }, [filtered]);

  const gridItems = useMemo(() => filtered.filter((o) => o.id !== featured?.id), [filtered, featured]);

  const counts = useMemo(() => {
    const c: Record<TypeFilter, number> = { all: 0, hackathon: 0, program: 0, funding: 0, event: 0, collaboration: 0 };
    for (const o of opportunities) {
      if (statusFilter !== "all" && statusFilter !== "engagements" && o.status !== statusFilter) continue;
      c.all++;
      c[o.type]++;
    }
    return c;
  }, [opportunities, statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Opportunity Hub & Deliverables</h1>
          <p className="text-sm text-text-muted mt-1">Discover verified opportunities, participate without per-application fees, and track deliverables execution.</p>
        </div>
        <button
          type="button"
          onClick={handlePostClick}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Plus className="w-4 h-4" /> Post an Opportunity
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTypeFilter(t); if (statusFilter === "engagements") setStatusFilter("open"); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                typeFilter === t && statusFilter !== "engagements"
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-surface-primary text-text-secondary border-border-strong hover:bg-background-primary"
              }`}
            >
              {TYPE_LABELS[t]} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("engagements")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              statusFilter === "engagements"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-surface-primary text-text-secondary border-border-strong hover:bg-background-primary"
            }`}
          >
            Track Deliverables ({engagements.length})
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs px-2 py-1.5 rounded-lg border border-border-strong bg-surface-primary text-text-secondary"
            aria-label="Status filter"
          >
            <option value="open">Open</option>
            <option value="closing-soon">Closing soon</option>
            <option value="closed">Closed</option>
            <option value="all">All status</option>
            <option value="engagements">Track Deliverables</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-disabled" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border-strong bg-surface-primary"
              aria-label="Search opportunities"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border border-dashed border-border-strong rounded-xl p-10 text-center">
          <p className="text-sm text-text-muted">Loading opportunities and execution workflows...</p>
        </div>
      ) : error ? (
        <div className="border border-status-error bg-status-error-soft rounded-xl p-10 text-center">
          <p className="text-sm text-status-error">Opportunities are unavailable: {error}</p>
        </div>
      ) : statusFilter === "engagements" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Active Engagements & Deliverables Tracking</h2>
          {engagements.length === 0 ? (
            <div className="border border-dashed border-border-strong rounded-xl p-10 text-center">
              <p className="text-sm text-text-muted">No active engagements with deliverables yet. Select an opportunity applicant or accept a gig to begin tracking execution.</p>
            </div>
          ) : (
            engagements.map((eng) => (
              <div key={eng.id} className="bg-surface-primary rounded-xl border border-border-strong p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-md font-semibold text-text-primary">{eng.opportunityTitle}</h3>
                    <p className="text-xs text-text-muted">Engagement ID: {eng.id} • Status: <span className="font-medium text-emerald-700">{eng.status}</span></p>
                  </div>
                  <button
                    onClick={() => setSelectedEngagement(eng)}
                    className="px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700"
                  >
                    View Deliverables
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border-strong rounded-xl p-10 text-center">
          <p className="text-sm text-text-muted">
            {opportunities.length === 0
              ? "Organizations haven't published any opportunities yet."
              : `No ${typeFilter === "all" ? "" : TYPE_LABELS[typeFilter].toLowerCase() + " "}opportunities match. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {featured && (
            <div className="lg:col-span-3">
              <OpportunityCard opportunity={featured} variant="featured" />
            </div>
          )}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {gridItems.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} variant="grid" />
            ))}
          </div>
        </div>
      )}

      {/* Post Opportunity Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-primary rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPostModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-1">Post an Opportunity</h2>
            <p className="text-xs text-text-muted mb-4">
              {currentRole === "founder" ? "List your verified startup opportunity for free (no subscription or credits required)." : "Publish an opportunity subject to verification."}
            </p>

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Collaborator for MVP"
                  className="w-full text-sm p-2.5 rounded-lg border border-border-strong bg-background-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-lg border border-border-strong bg-background-primary"
                  >
                    <option value="collaboration">Collaboration call</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="program">Program</option>
                    <option value="funding">Funding / Grant</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Compensation Type</label>
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-lg border border-border-strong bg-background-primary"
                  >
                    <option value="paid-gig">Paid Gig (Requires KYC & Sub)</option>
                    <option value="equity">Equity Collaboration</option>
                    <option value="grant">Grant / Free</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Description & Scope</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the opportunity, responsibilities, and expectations..."
                  rows={4}
                  className="w-full text-sm p-2.5 rounded-lg border border-border-strong bg-background-primary resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg border border-border-strong bg-background-primary"
                />
              </div>

              <div className="border-t border-border-default pt-3">
                <h3 className="text-xs font-semibold text-text-primary mb-2">Initial Deliverable (Milestone)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newDeliverableTitle}
                    onChange={(e) => setNewDeliverableTitle(e.target.value)}
                    placeholder="Deliverable title"
                    className="w-full text-xs p-2 rounded-lg border border-border-strong bg-background-primary"
                  />
                  <input
                    type="date"
                    value={newDeliverableDue}
                    onChange={(e) => setNewDeliverableDue(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border-strong bg-background-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border-strong text-text-secondary hover:bg-background-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300"
                >
                  {posting ? "Publishing..." : "Publish Verified Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Engagement Deliverables Modal */}
      {selectedEngagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-primary rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEngagement(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-1">Execution & Deliverables</h2>
            <p className="text-xs text-text-muted mb-4">{selectedEngagement.opportunityTitle}</p>

            <div className="space-y-3">
              {selectedEngagement.deliverables.map((del) => (
                <div key={del.id} className="border border-border-strong rounded-xl p-4 bg-background-primary">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-text-primary">{del.title}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-violet-100 text-violet-800">{del.status}</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{del.description || "No description"}</p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Owner: {del.owner}</span>
                    <span>Due: {del.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedEngagement(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
