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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0066ff] dark:text-[#58a6ff]">
              <GraduationCap className="h-4 w-4" /> Mentorship
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Find a mentor</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Browse persisted mentorship rooms and apply to the ones aligned with your venture.
            </p>
          </div>
        </header>

        {loading ? (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading available mentorship rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            No published mentorship rooms are available.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{room.name}</h2>
                      <p className="mt-1.5 text-sm font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
                        {room.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {room.menteeCount ?? 0}/{room.capacity}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {(room.expertise ?? []).slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-[#0066ff]/20 bg-[#0066ff]/10 dark:bg-[#0066ff]/20 px-2.5 py-1 text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <Link
                      to={`/founder/mentorship/rooms/${room.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline"
                    >
                      View room <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelected(room.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
                    >
                      <Send className="h-4 w-4" /> Apply
                    </button>
                  </div>

                  {selected === room.id && (
                    <div className="mt-4 space-y-3 border-t border-black/[0.06] dark:border-white/10 pt-4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Why this mentorship is a fit
                        <textarea
                          value={coverLetter}
                          onChange={(event) => setCoverLetter(event.target.value)}
                          rows={4}
                          placeholder="Tell the mentor about your goals and how you can work together..."
                          className="mt-2 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all font-normal"
                        />
                      </label>
                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          className="rounded-xl border border-black/[0.08] dark:border-white/10 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void apply(room.id)}
                          disabled={!coverLetter.trim()}
                          className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Submit application
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
