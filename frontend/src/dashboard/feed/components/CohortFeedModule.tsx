import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Video, FileText, ExternalLink, Send, CheckCircle2, Clock, ChevronRight, X
} from "lucide-react";
import {
  fetchMyCohorts, fetchCohortHub, submitCohortAssignment,
  type CohortSummary, type CohortHubData, type CohortAssignment
} from "@/lib/api/cohortCollaboration";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CohortFeedModule() {
  const { profile } = useAuth();
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [hubData, setHubData] = useState<CohortHubData | null>(null);
  const [loading, setLoading] = useState(true);

  // Submit modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CohortAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMyCohorts()
      .then(async (list) => {
        if (!alive) return;
        setCohorts(list);
        if (list.length > 0) {
          const hub = await fetchCohortHub(list[0].id).catch(() => null);
          if (alive && hub) setHubData(hub);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading || !cohorts.length || !hubData) return null;

  const nextClass = hubData.classes.find(
    (c) => new Date(c.scheduledAt) > new Date() && c.status !== "completed"
  );
  const pendingAssignment = hubData.assignments.find((a) => !a.mySubmission);
  const latestBroadcast = hubData.recentBroadcasts[0];

  if (!nextClass && !pendingAssignment && !latestBroadcast) return null;

  const messageRoute =
    profile?.role === "collaborator" ? "/collaborator/messages" : "/founder/messages";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || (!submissionText.trim() && !submissionLink.trim())) return;
    setSubmitting(true);
    try {
      await submitCohortAssignment(hubData.cohort.id, selectedAssignment.id, {
        content: submissionText,
        link: submissionLink,
      });
      toast.success("Assignment submitted successfully!");
      setSubmitModalOpen(false);
      setSubmissionText("");
      setSubmissionLink("");
      // Refresh
      const updated = await fetchCohortHub(hubData.cohort.id);
      setHubData(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 mx-4 mt-2 overflow-hidden rounded-xl border border-role-organization/30 bg-surface-primary shadow-sm">
      {/* Banner Top Strip */}
      <div className="bg-role-organization-soft/60 px-4 py-2 border-b border-role-organization/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-role-organization" />
          <span className="text-xs font-semibold text-role-organization uppercase tracking-wider font-mono">
            {hubData.cohort.name}
          </span>
          <span className="text-[11px] text-text-muted">· {cohorts[0].organizationName}</span>
        </div>
        <Link
          to={messageRoute}
          className="inline-flex items-center gap-1 text-xs font-medium text-role-organization hover:underline"
        >
          Cohort Chat <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {/* Next Live Class */}
        {nextClass && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface-secondary/50 border border-border-default">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-role-organization text-white shrink-0 mt-0.5">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-status-success-soft text-status-success font-semibold">
                    Live Class
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(nextClass.scheduledAt).toLocaleString()} ({nextClass.durationMinutes}m)
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mt-1">{nextClass.title}</h4>
                <p className="text-xs text-text-muted">Host: {nextClass.instructor}</p>
              </div>
            </div>
            <a
              href={nextClass.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-role-organization text-white text-xs font-semibold hover:bg-role-organization-hover transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Join Room
            </a>
          </div>
        )}

        {/* Pending Assignment */}
        {pendingAssignment && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface-secondary/50 border border-border-default">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-status-info text-white shrink-0 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-secondary text-text-muted font-semibold">
                    Assignment
                  </span>
                  <span className="text-xs text-text-muted">
                    Due: {new Date(pendingAssignment.dueDate).toLocaleDateString()} · {pendingAssignment.points} pts
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mt-1">{pendingAssignment.title}</h4>
                <p className="text-xs text-text-muted line-clamp-1">{pendingAssignment.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAssignment(pendingAssignment);
                setSubmitModalOpen(true);
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface-primary text-text-primary text-xs font-semibold hover:border-role-organization transition-colors"
            >
              Submit Deliverable
            </button>
          </div>
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {submitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-primary border border-border-default rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-secondary text-text-muted font-semibold">
                  Cohort Deliverable
                </span>
                <h3 className="text-lg font-bold text-text-primary mt-1">{selectedAssignment.title}</h3>
                <p className="text-xs text-text-muted">Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()} · {selectedAssignment.points} Points</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary my-3 p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle whitespace-pre-line">
              {selectedAssignment.description}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Submission Notes / Summary
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your progress, key milestones, or notes for the reviewers..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Resource Link / Document URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/... or Figma / Google Drive link"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-role-organization text-white hover:bg-role-organization-hover disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Cohort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
