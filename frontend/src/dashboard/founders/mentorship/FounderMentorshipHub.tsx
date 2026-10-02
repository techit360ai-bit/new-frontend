import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Send } from "lucide-react";
import { toast } from "sonner";
import { applyToMentorshipRoom, listMentorshipRooms, type MentorshipRoom } from "@/lib/api/mentorship";

export function FounderMentorshipHub() {
  const [rooms, setRooms] = useState<MentorshipRoom[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listMentorshipRooms()
      .then((data) => alive && setRooms(data.rooms ?? []))
      .catch(() => alive && setRooms([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const apply = async (roomId: string) => {
    if (!coverLetter.trim()) return;
    try {
      await applyToMentorshipRoom(roomId, { coverLetter });
      setSelected(null);
      setCoverLetter("");
      toast.success("Mentorship application submitted.");
    } catch {
      toast.error("Unable to submit the mentorship application.");
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4" />Mentorship</div>
            <h1 className="text-3xl font-semibold">Find a mentor</h1>
            <p className="mt-1 text-muted-foreground">Browse persisted mentorship rooms and apply to the ones aligned with your venture.</p>
          </div>
        </header>
        {loading ? <p className="text-sm text-muted-foreground">Loading available mentorship rooms...</p> : rooms.length === 0 ? <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No published mentorship rooms are available.</div> : <div className="grid gap-4 md:grid-cols-2">{rooms.map((room) => <article key={room.id} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{room.name}</h2><p className="mt-1 text-sm text-muted-foreground">{room.description}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{room.menteeCount ?? 0}/{room.capacity}</span></div><div className="mt-5 flex flex-wrap items-center gap-2">{(room.expertise ?? []).slice(0, 4).map((skill) => <span key={skill} className="rounded-md bg-muted px-2 py-1 text-xs">{skill}</span>)}</div><div className="mt-5 flex items-center gap-3"><Link to={`/founder/mentorship/rooms/${room.id}`} className="inline-flex items-center gap-1 text-sm text-primary">View room <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={() => setSelected(room.id)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"><Send className="h-4 w-4" />Apply</button></div>{selected === room.id && <div className="mt-4 space-y-3 border-t border-border pt-4"><label className="block text-sm font-medium">Why this mentorship is a fit<textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button><button type="button" onClick={() => void apply(room.id)} disabled={!coverLetter.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">Submit application</button></div></div>}</article>)}</div>}
      </div>
    </main>
  );
}
