import { useEffect, useState, useRef } from "react";
import {
  GraduationCap, Video, MessageSquare, Send, Plus, Users, Calendar, Clock,
  FileText, CheckCircle, ExternalLink, Paperclip, Mail, Sparkles, ChevronRight, AlertCircle, ArrowLeft
} from "lucide-react";
import {
  fetchOrgCohorts, fetchCohortHub, scheduleCohortLiveClass, sendCohortInMailBroadcast,
  sendCohortChatMessage, createCohortAssignment, fetchCohortSubmissions,
  type CohortHubData, type CohortSubmission
} from "@/lib/api/cohortCollaboration";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Incubator() {
  const { profile } = useAuth();
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [hubData, setHubData] = useState<CohortHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"classes" | "chat" | "broadcasts" | "assignments">("classes");

  // Form states
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classTitle, setClassTitle] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classDuration, setClassDuration] = useState("60");
  const [classInstructor, setClassInstructor] = useState("");

  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignPoints, setAssignPoints] = useState("100");

  const [chatInput, setChatInput] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<CohortSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCohorts();
  }, []);

  const loadCohorts = async () => {
    setLoading(true);
    try {
      const list = await fetchOrgCohorts();
      setCohorts(list);
      if (list.length > 0 && !selectedCohortId) {
        setSelectedCohortId(list[0].id);
      }
    } catch {
      // Fallback or empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCohortId) return;
    loadHub(selectedCohortId);
  }, [selectedCohortId]);

  const loadHub = async (id: string) => {
    try {
      const data = await fetchCohortHub(id);
      setHubData(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load cohort hub");
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hubData?.recentMessages, activeTab]);

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !classTitle || !classDate) return;
    const profileName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";
    try {
      await scheduleCohortLiveClass(selectedCohortId, {
        title: classTitle,
        description: classDescription,
        scheduledAt: new Date(classDate).toISOString(),
        durationMinutes: Number(classDuration) || 60,
        instructor: classInstructor || profileName || "Cohort Lead",
      });
      toast.success("Live class scheduled! Notifications sent to cohort members.");
      setClassModalOpen(false);
      setClassTitle("");
      setClassDescription("");
      setClassDate("");
      loadHub(selectedCohortId);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule class");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !broadcastTitle || !broadcastMessage) return;
    try {
      await sendCohortInMailBroadcast(selectedCohortId, {
        title: broadcastTitle,
        message: broadcastMessage,
      });
      toast.success("Broadcast in-mail sent to all cohort members!");
      setBroadcastModalOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
      loadHub(selectedCohortId);
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !assignTitle) return;
    try {
      await createCohortAssignment(selectedCohortId, {
        title: assignTitle,
        description: assignDescription,
        dueDate: assignDueDate ? new Date(assignDueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        points: Number(assignPoints) || 100,
      });
      toast.success("Assignment published to cohort!");
      setAssignModalOpen(false);
      setAssignTitle("");
      setAssignDescription("");
      loadHub(selectedCohortId);
    } catch (err: any) {
      toast.error(err.message || "Failed to create assignment");
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      await sendCohortChatMessage(selectedCohortId, { text });
      loadHub(selectedCohortId);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    if (!selectedCohortId) return;
    setSelectedAssignmentId(assignmentId);
    setLoadingSubs(true);
    try {
      const res = await fetchCohortSubmissions(selectedCohortId, assignmentId);
      setSubmissions(res.submissions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load submissions");
    } finally {
      setLoadingSubs(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-role-organization" />
            <h1 className="text-2xl font-bold text-text-primary">Incubator Cohort Hub</h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Operate live classes, WhatsApp-style group communication, announcements, and assignments for your cohorts.
          </p>
        </div>

        {/* Cohort Selector */}
        {cohorts.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-text-muted font-mono">Cohort:</span>
            <select
              value={selectedCohortId || ""}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="bg-surface-primary border border-border-default text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-role-organization"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!cohorts.length && !loading && (
        <div className="text-center py-12 border border-dashed border-border-default rounded-xl bg-surface-primary p-8">
          <GraduationCap className="h-12 w-12 mx-auto text-text-muted mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-text-primary">No Active Cohorts Found</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mt-1 mb-4">
            Create your first program cohort to start scheduling live classes, managing WhatsApp-style discussions, and issuing assignments.
          </p>
        </div>
      )}

      {hubData && (
        <div className="space-y-6">
          {/* Cohort Overview Card */}
          <div className="bg-surface-primary border border-border-default rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-role-organization-soft text-role-organization uppercase tracking-wider">
                  {hubData.cohort.status}
                </span>
                <h2 className="text-xl font-bold text-text-primary mt-1">{hubData.cohort.name}</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {hubData.members.length} enrolled founders & collaborators
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-role-organization text-white text-sm font-medium hover:bg-role-organization-hover transition-colors"
                >
                  <Video className="h-4 w-4" /> Schedule Live Class
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary text-sm font-medium hover:bg-surface-secondary/80 transition-colors"
                >
                  <Mail className="h-4 w-4" /> Send In-Mail
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary text-sm font-medium hover:bg-surface-secondary/80 transition-colors"
                >
                  <Plus className="h-4 w-4" /> New Assignment
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border-default mt-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("classes")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "classes"
                    ? "border-role-organization text-role-organization"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <Video className="h-4 w-4" /> Live Classes ({hubData.classes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-role-organization text-role-organization"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <MessageSquare className="h-4 w-4" /> Cohort Discussion
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("broadcasts")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "broadcasts"
                    ? "border-role-organization text-role-organization"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <Mail className="h-4 w-4" /> In-Mails & Broadcasts ({hubData.recentBroadcasts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "assignments"
                    ? "border-role-organization text-role-organization"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <FileText className="h-4 w-4" /> Assignments ({hubData.assignments.length})
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE CLASSES */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              {!hubData.classes.length ? (
                <div className="text-center py-10 bg-surface-primary border border-border-default rounded-xl p-6">
                  <Video className="h-10 w-10 mx-auto text-text-muted mb-2 opacity-60" />
                  <p className="text-sm font-medium text-text-primary">No live classes scheduled yet</p>
                  <p className="text-xs text-text-muted mt-1">
                    Click "Schedule Live Class" above to set up a WebRTC interactive session for this cohort.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hubData.classes.map((cls) => {
                    const isUpcoming = new Date(cls.scheduledAt) > new Date();
                    return (
                      <div key={cls.id} className="bg-surface-primary border border-border-default rounded-xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                              isUpcoming ? "bg-status-success-soft text-status-success" : "bg-surface-secondary text-text-muted"
                            }`}>
                              {isUpcoming ? "Upcoming" : "Completed"}
                            </span>
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {cls.durationMinutes} mins
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-text-primary mt-2">{cls.title}</h3>
                          {cls.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{cls.description}</p>}
                          <div className="mt-3 text-xs text-text-secondary flex items-center gap-3">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-text-muted" /> {new Date(cls.scheduledAt).toLocaleString()}</span>
                            <span>Host: <strong className="text-text-primary">{cls.instructor}</strong></span>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between">
                          <a
                            href={cls.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-role-organization text-white hover:bg-role-organization-hover transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Join Live Room
                          </a>
                          <span className="text-[11px] text-text-muted font-mono">{cls.meetingUrl}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHATSAPP-STYLE COHORT DISCUSSION */}
          {activeTab === "chat" && (
            <div className="bg-surface-primary border border-border-default rounded-xl overflow-hidden flex flex-col h-[600px]">
              {/* Chat Sub-header */}
              <div className="px-5 py-3 border-b border-border-default bg-surface-secondary/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    {hubData.cohort.name} Discussion
                    <span className="text-[10px] bg-status-success-soft text-status-success px-1.5 py-0.5 rounded uppercase font-mono">Cohort Channel</span>
                  </h3>
                  <p className="text-xs text-text-muted">{hubData.members.length} participants active</p>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background-primary/40">
                {!hubData.recentMessages.length ? (
                  <div className="text-center py-16 text-text-muted text-xs">
                    No messages in this cohort group yet. Send a note to kick off the conversation!
                  </div>
                ) : (
                  hubData.recentMessages.map((msg) => {
                    const isMe = msg.senderId === profile?.id;
                    const isAnnouncement = msg.type === "broadcast" || msg.type === "live_class_announcement" || msg.type === "assignment_announcement";

                    if (isAnnouncement) {
                      return (
                        <div key={msg.id} className="mx-auto my-2 max-w-lg bg-role-organization-soft/40 border border-role-organization/20 rounded-xl p-3.5 text-xs text-text-primary text-center">
                          <p className="font-semibold text-role-organization mb-1">
                            {msg.senderName} ({msg.senderRole})
                          </p>
                          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          <span className="text-[10px] text-text-muted mt-1 block">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-baseline gap-2 mb-0.5 px-1">
                          <span className="text-[11px] font-semibold text-text-secondary">{msg.senderName}</span>
                          <span className="text-[10px] uppercase font-mono text-text-muted px-1 rounded bg-surface-secondary">{msg.senderRole}</span>
                        </div>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMe
                            ? "bg-role-organization text-white rounded-br-none"
                            : "bg-surface-primary border border-border-default text-text-primary rounded-bl-none"
                        }`}>
                          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          {msg.attachmentUrl && (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-2 flex items-center gap-1.5 text-xs underline ${isMe ? "text-white" : "text-role-organization"}`}
                            >
                              <Paperclip className="h-3 w-3" /> {msg.attachmentName || "View attachment"}
                            </a>
                          )}
                          <span className={`text-[10px] mt-1 block text-right ${isMe ? "text-white/70" : "text-text-muted"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-border-default bg-surface-primary flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message to the cohort..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-surface-secondary border border-border-default rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-lg bg-role-organization text-white disabled:opacity-40 hover:bg-role-organization-hover transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: IN-MAILS & BROADCASTS */}
          {activeTab === "broadcasts" && (
            <div className="space-y-4">
              {!hubData.recentBroadcasts.length ? (
                <div className="text-center py-10 bg-surface-primary border border-border-default rounded-xl p-6">
                  <Mail className="h-10 w-10 mx-auto text-text-muted mb-2 opacity-60" />
                  <p className="text-sm font-medium text-text-primary">No in-mail broadcasts sent yet</p>
                  <p className="text-xs text-text-muted mt-1">
                    Send high-priority in-mails directly to all enrolled founders and collaborators.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hubData.recentBroadcasts.map((b) => (
                    <div key={b.id} className="bg-surface-primary border border-border-default rounded-xl p-5 hover:border-border-strong transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-role-organization flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> Broadcast In-Mail
                        </span>
                        <span className="text-xs text-text-muted font-mono">{new Date(b.createdAt).toLocaleString()}</span>
                      </div>
                      <h3 className="text-base font-semibold text-text-primary mt-2">{b.title}</h3>
                      <p className="text-xs text-text-secondary mt-1 whitespace-pre-line leading-relaxed">{b.message}</p>
                      <div className="mt-3 text-[11px] text-text-muted font-mono">
                        Delivered to {b.recipientCount} cohort members
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS & SUBMISSIONS */}
          {activeTab === "assignments" && (
            <div className="space-y-4">
              {selectedAssignmentId ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignmentId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
                  </button>

                  <div className="bg-surface-primary border border-border-default rounded-xl p-5">
                    <h3 className="text-lg font-bold text-text-primary">Member Submissions</h3>
                    <p className="text-xs text-text-muted mt-0.5">Review responses submitted by founders and collaborators.</p>

                    {loadingSubs ? (
                      <div className="text-center py-8 text-xs text-text-muted">Loading submissions...</div>
                    ) : !submissions.length ? (
                      <div className="text-center py-8 text-xs text-text-muted">No submissions received yet for this assignment.</div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {submissions.map((sub) => (
                          <div key={sub.id} className="border border-border-default rounded-lg p-4 bg-surface-secondary/40">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-text-primary text-sm">{sub.userName}</span>
                                <span className="text-xs text-text-muted ml-2 font-mono uppercase">({sub.userRole})</span>
                              </div>
                              <span className="text-xs text-status-success font-semibold flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-text-primary mt-2 whitespace-pre-line bg-surface-primary p-3 rounded border border-border-subtle">
                              {sub.content}
                            </p>
                            {sub.link && (
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-role-organization hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> {sub.link}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!hubData.assignments.length ? (
                    <div className="text-center py-10 bg-surface-primary border border-border-default rounded-xl p-6">
                      <FileText className="h-10 w-10 mx-auto text-text-muted mb-2 opacity-60" />
                      <p className="text-sm font-medium text-text-primary">No assignments created yet</p>
                      <p className="text-xs text-text-muted mt-1">
                        Issue assignments to your cohort to evaluate progress, deliverables, and architecture blueprints.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hubData.assignments.map((a) => (
                        <div key={a.id} className="bg-surface-primary border border-border-default rounded-xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
                                {a.points} Points
                              </span>
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                Due: {new Date(a.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-text-primary mt-2">{a.title}</h3>
                            <p className="text-xs text-text-muted mt-1 line-clamp-3">{a.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                              {a.submissionCount || 0} Submissions
                            </span>
                            <button
                              type="button"
                              onClick={() => handleViewSubmissions(a.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-role-organization hover:text-role-organization-hover transition-colors"
                            >
                              View Submissions <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE LIVE CLASS MODAL */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-primary border border-border-default rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-1">Schedule Cohort Live Class</h3>
            <p className="text-xs text-text-muted mb-4">An interactive WebRTC live meeting room will be generated and broadcast to all members.</p>
            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Investor Pitching Clinic"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What will this class cover?"
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={classDuration}
                    onChange={(e) => setClassDuration(e.target.value)}
                    className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Instructor / Host</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe (Partner)"
                  value={classInstructor}
                  onChange={(e) => setClassInstructor(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-role-organization text-white hover:bg-role-organization-hover transition-colors"
                >
                  Schedule & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST IN-MAIL MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-primary border border-border-default rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-1">Broadcast In-Mail to Cohort</h3>
            <p className="text-xs text-text-muted mb-4">Sends a high-priority in-app in-mail and notification to every member of this cohort.</p>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Final Submission Deadline Announced"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your announcement or in-mail message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-role-organization text-white hover:bg-role-organization-hover transition-colors"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-primary border border-border-default rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-1">Create Cohort Assignment</h3>
            <p className="text-xs text-text-muted mb-4">Post a task or deliverable for founders and collaborators to submit.</p>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Discovery Interviews Summary"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Instructions & Guidelines</label>
                <textarea
                  rows={3}
                  placeholder="Detailed instructions, formatting requirements, and rubric..."
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Total Points</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={assignPoints}
                    onChange={(e) => setAssignPoints(e.target.value)}
                    className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-role-organization"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-role-organization text-white hover:bg-role-organization-hover transition-colors"
                >
                  Create & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
