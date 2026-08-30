import { useEffect, useState } from "react";
import { Check, X, Mail, Calendar, Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listMentorshipApplications, reviewMentorshipApplication, type MentorshipApplication } from "@/lib/api/mentorship";
import { ACCENT_TEXT, ACCENT_SOFT } from "./theme";
import { toast } from "sonner";

export function Applications() {
  const [applications, setApplications] = useState<MentorshipApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<MentorshipApplication | null>(null);
  useEffect(() => { listMentorshipApplications().then((result) => setApplications(result.applications)).catch(() => toast.error("Unable to load applications.")); }, []);

  const handleAccept = (id: string) => {
    reviewMentorshipApplication(id, "accepted").then(() => { setApplications((apps) => apps.map((app) => app.id === id ? { ...app, status: "accepted" } : app)); toast.success("Application accepted! Mentee has been notified."); }).catch(() => toast.error("Unable to accept application."));
  };

  const handleReject = (id: string) => {
    reviewMentorshipApplication(id, "rejected").then(() => { setApplications((apps) => apps.map((app) => app.id === id ? { ...app, status: "rejected" } : app)); toast.success("Application rejected. Applicant has been notified."); }).catch(() => toast.error("Unable to reject application."));
  };

  const pendingApplications = applications.filter((app) => app.status === "pending");
  const acceptedApplications = applications.filter((app) => app.status === "accepted");
  const rejectedApplications = applications.filter((app) => app.status === "rejected");

  const ApplicationCard = ({ application }: { application: MentorshipApplication }) => (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setSelectedApplication(application)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <img
            src={application.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(application.applicantName || application.applicantId)}`}
            alt={application.applicantName || "Applicant"}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{application.applicantName || "Applicant"}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{application.applicantId}</span>
                </div>
              </div>
              <Badge variant={application.status === "pending" ? "secondary" : "default"}>
                {application.status}
              </Badge>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                  <span>Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Date unavailable"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{application.experience}</span>
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-sm font-medium">Applying to:</p>
              <p className={`text-sm ${ACCENT_TEXT}`}>{application.roomName || application.roomId}</p>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-sm font-medium">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {application.skills.map((skill) => (
                  <span key={skill} className={`rounded px-2 py-1 text-xs ${ACCENT_SOFT}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">Cover Letter:</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{application.coverLetter}</p>
            </div>

            {application.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(application.id);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-status-success px-4 py-2 text-white transition-colors hover:bg-status-success"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(application.id);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-status-error px-4 py-2 text-white transition-colors hover:bg-status-error"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ label }: { label: string }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-3xl">Mentee Applications</h1>
        <p className="text-muted-foreground">Review and manage applications to your mentorship rooms</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-status-success dark:text-status-success">
              {acceptedApplications.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-status-error dark:text-status-error">
              {rejectedApplications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({acceptedApplications.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <EmptyState label="No pending applications" />
          ) : (
            pendingApplications.map((app) => <ApplicationCard key={app.id} application={app} />)
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedApplications.length === 0 ? (
            <EmptyState label="No accepted applications yet" />
          ) : (
            acceptedApplications.map((app) => <ApplicationCard key={app.id} application={app} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length === 0 ? (
            <EmptyState label="No rejected applications" />
          ) : (
            rejectedApplications.map((app) => <ApplicationCard key={app.id} application={app} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedApplication.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(selectedApplication.applicantName || selectedApplication.applicantId)}`}
                    alt={selectedApplication.applicantName || "Applicant"}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedApplication.applicantName || "Applicant"}</h3>
                    <p className="text-muted-foreground">{selectedApplication.email || selectedApplication.applicantId}</p>
                    <Badge
                      className="mt-2"
                      variant={selectedApplication.status === "pending" ? "secondary" : "default"}
                    >
                      {selectedApplication.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Applying to:</h4>
                  <p className={ACCENT_TEXT}>{selectedApplication.roomName || selectedApplication.roomId}</p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Experience:</h4>
                  <p className="text-muted-foreground">{selectedApplication.experience}</p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.skills.map((skill) => (
                      <span key={skill} className={`rounded px-3 py-1 text-sm ${ACCENT_SOFT}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Cover Letter:</h4>
                  <p className="rounded-lg bg-muted/50 p-4 text-muted-foreground">
                    {selectedApplication.coverLetter}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Applied Date:</h4>
                  <p className="text-muted-foreground">
                    {selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : "Date unavailable"}
                  </p>
                </div>

                {selectedApplication.status === "pending" && (
                  <div className="flex gap-3 border-t border-border pt-4">
                    <button
                      onClick={() => {
                        handleAccept(selectedApplication.id);
                        setSelectedApplication(null);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-status-success px-4 py-2 text-white transition-colors hover:bg-status-success"
                    >
                      <Check className="h-4 w-4" />
                      Accept Application
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApplication.id);
                        setSelectedApplication(null);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-status-error px-4 py-2 text-white transition-colors hover:bg-status-error"
                    >
                      <X className="h-4 w-4" />
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
