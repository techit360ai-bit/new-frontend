import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { HackathonRegistration, FinalSubmission } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { ResultsView } from "./ResultsView";
import { submitHackathonFinal } from "@/lib/api/hackathon";

interface Props {
  registration: HackathonRegistration;
}

const URL_FIELDS: { key: "demoUrl" | "deckUrl" | "videoUrl"; label: string; helper: string }[] = [
  { key: "demoUrl",  label: "Demo link",  helper: "A live demo, repo, or deployed build judges can open." },
  { key: "deckUrl",  label: "Pitch deck", helper: "Slides — link to a deck, PDF, or doc." },
  { key: "videoUrl", label: "Demo video", helper: "A short walkthrough or pitch video." },
];

const MIN_SUMMARY = 40;

const EMPTY = { demoUrl: "", deckUrl: "", videoUrl: "", summary: "" };

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function SubmitStage({ registration }: Props) {
  const { registerForHackathon } = useFounderProfile();
  const [values, setValues] = useState<typeof EMPTY>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  // Locked once a final submission exists → show results.
  if (registration.finalSubmission) {
    return <ResultsView registration={registration} />;
  }

  const urlsValid = URL_FIELDS.every((f) => isHttpUrl(values[f.key]));
  const summaryValid = values.summary.trim().length >= MIN_SUMMARY;
  const canSubmit = urlsValid && summaryValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const submission: FinalSubmission = {
      demoUrl: values.demoUrl.trim(),
      deckUrl: values.deckUrl.trim(),
      videoUrl: values.videoUrl.trim(),
      summary: values.summary.trim(),
      submittedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      const result = await submitHackathonFinal(
        registration.hackathonId,
        registration.teamId,
        submission,
      );
      if (!result.ok || !result.registration) {
        toast.error("The final submission was not persisted.");
        return;
      }
      registerForHackathon(result.registration);
      toast.success("Pitch submitted for judging");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The final submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 sm:p-8 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submit &amp; pitch</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Share your demo, deck, and video, plus a short summary. Submission locks after it is persisted.
        </p>
      </div>

      {registration.workspaceId ? (
        <Link to={`/team-workspace/${registration.teamId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline mb-5">
          Open team workspace →
        </Link>
      ) : (
        <p className="text-xs text-slate-400 mb-5">Create your team workspace in the Build stage.</p>
      )}

      <div className="space-y-5">
        {URL_FIELDS.map((f) => {
          const val = values[f.key];
          const invalid = val.trim().length > 0 && !isHttpUrl(val);
          return (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{f.label}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{f.helper}</p>
              <input
                type="url"
                value={val}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder="https://"
                className={`w-full text-sm border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  invalid
                    ? "border-amber-400 focus:ring-amber-200"
                    : "border-black/[0.08] dark:border-white/10 focus:ring-[#0066ff]/20 focus:border-[#0066ff]"
                }`}
              />
              {invalid && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Enter a valid http(s) URL.</p>
              )}
            </div>
          );
        })}

        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Summary</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">What you built and why it matters — at least {MIN_SUMMARY} characters.</p>
          <textarea
            rows={4}
            value={values.summary}
            onChange={(e) => setValues((p) => ({ ...p, summary: e.target.value }))}
            className="w-full text-sm border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-all"
          />
          <div className="flex justify-end mt-1.5">
            <span className={`text-xs ${summaryValid ? "text-slate-400" : "text-amber-600 dark:text-amber-400 font-medium"}`}>
              {values.summary.trim().length}/{MIN_SUMMARY} min
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-5 border-t border-black/[0.06] dark:border-white/10">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
            canSubmit
              ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]"
              : "bg-slate-100 dark:bg-white/[0.05] text-slate-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit pitch"}
        </button>
      </div>
    </div>
  );
}
