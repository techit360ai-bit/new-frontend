import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video } from "lucide-react";
import { createEvent } from "@/lib/demo/client";
import type { DemoKind } from "@/lib/demo/types";

const KINDS: DemoKind[] = ["startup", "investor", "hackathon", "launch", "mentorship"];

export function DemoCreate() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<DemoKind>("startup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ev = await createEvent({ kind, title: title.trim(), description, assetUrl: assetUrl || undefined });
      navigate(`/demos/${ev.id}`);
    } catch {
      setError("Could not create the demo. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 font-bricolage animate-in fade-in duration-300">
      <div>
        <button
          type="button"
          onClick={() => navigate("/demos")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Demo Rooms</span>
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Video className="w-7 h-7 text-[#0066ff]" />
          <span>New Demo Room</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Set up a demo event, then invite judges, investors or your audience.
        </p>
      </div>

      <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Demo Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                  kind === k
                    ? "border-[#0066ff] bg-[#0066ff]/10 text-[#0066ff] shadow-sm"
                    : "border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Demo Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Series A live demo"
            className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Outline key topics, agenda, or highlights for attendees..."
            className="w-full resize-none border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Asset URL (deck / video, optional)
          </label>
          <input
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]"
          />
        </div>

        {error && (
          <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-500/20">
            {error}
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-black/[0.06] dark:border-white/10">
          <button
            type="button"
            onClick={() => navigate("/demos")}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || submitting}
            className="text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            {submitting ? "Creating..." : "Create Demo Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
