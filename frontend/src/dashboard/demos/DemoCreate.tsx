import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New demo room</h1>
        <p className="text-sm text-slate-500 mt-0.5">Set up a demo event, then invite judges, investors or your audience.</p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as DemoKind)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Series A live demo"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Asset URL (deck / video, optional)</span>
        <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={submit} disabled={!title.trim() || submitting}
          className="text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 px-4 py-2 rounded-lg">
          {submitting ? "Creating…" : "Create demo"}
        </button>
        <button type="button" onClick={() => navigate("/demos")} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
    </div>
  );
}
