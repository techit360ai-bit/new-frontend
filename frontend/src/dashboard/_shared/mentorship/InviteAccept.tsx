import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptMentorshipInvite, resolveMentorshipInvite, type MentorshipRoom } from "@/lib/api/mentorship";

export function MentorshipInviteAccept() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<MentorshipRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    resolveMentorshipInvite(token).then((result) => setRoom(result.room)).catch(() => setRoom(null)).finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const result = await acceptMentorshipInvite(token);
      toast.success("You joined the mentorship room.");
      navigate(`/founder/mentorship/rooms/${result.room.id}`, { replace: true });
    } catch {
      toast.error("This mentorship invite is invalid, expired or full.");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking invitation...</div>;
  if (!room) return <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center"><h1 className="text-xl font-semibold">Invitation unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This invitation is invalid, expired or no longer available.</p><Link to="/founder/mentorship" className="mt-5 text-sm text-primary">Browse mentorship rooms</Link></div>;
  return <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4"><section className="w-full rounded-xl border border-border bg-card p-6 text-center shadow-sm"><CheckCircle2 className="mx-auto h-10 w-10 text-status-success" /><h1 className="mt-4 text-2xl font-semibold">Join {room.name}</h1><p className="mt-2 text-sm text-muted-foreground">{room.description}</p><button type="button" onClick={() => void accept()} disabled={busy} className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busy ? "Joining..." : "Join mentorship room"}</button></section></div>;
}
