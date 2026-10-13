import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptProgramInvitation } from "@/lib/api/organization";

/**
 * Founder-facing acceptance of an organization program invite. The invite link
 * (from the notification) carries the token; accepting links the founder's
 * project to the program so the org roster and execution scope resolve.
 */
export function ProgramInviteAccept() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  const accept = async () => {
    if (!token) return toast.error("This invite link is missing its token.");
    setAccepting(true);
    try {
      const result = await acceptProgramInvitation(token);
      setDone(true);
      toast.success("You have joined the program.");
      if (result.projectId) navigate(`/workspaces/copilot?project=${encodeURIComponent(result.projectId)}`);
    } catch {
      toast.error("Unable to accept this invite. It may have already been used.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl items-center justify-center p-6 lg:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Program invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An organization invited you to join one of their TechIT incubation programs. Accepting links
            your startup&apos;s project to the program so your progress is visible to your cohort.
          </p>
          <button
            disabled={accepting || done || !token}
            onClick={accept}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {done ? "Joined" : accepting ? "Accepting..." : "Accept invitation"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
