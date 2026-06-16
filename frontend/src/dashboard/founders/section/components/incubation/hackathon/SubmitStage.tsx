import { useState } from "react";
import { toast } from "sonner";
import type { HackathonRegistration, FinalSubmission } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { deriveJudgeFeedback } from "@/dashboard/_shared/hackathon/results";
import { ResultsView } from "./ResultsView";

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
  const { submitFinal } = useFounderProfile();
  const [values, setValues] = useState<typeof EMPTY>(EMPTY);

  // Locked once a final submission exists → show results.
  if (registration.finalSubmission) {
    return <ResultsView registration={registration} />;
  }

  const urlsValid = URL_FIELDS.every((f) => isHttpUrl(values[f.key]));
  const summaryValid = values.summary.trim().length >= MIN_SUMMARY;
  const canSubmit = urlsValid && summaryValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const submission: FinalSubmission = {
      demoUrl: values.demoUrl.trim(),
      deckUrl: values.deckUrl.trim(),
      videoUrl: values.videoUrl.trim(),
      summary: values.summary.trim(),
      submittedAt: new Date().toISOString(),
    };
    // Merge the submission in before deriving so demo credit + momentum bump count.
    const merged: HackathonRegistration = { ...registration, finalSubmission: submission };
    const feedback = deriveJudgeFeedback(merged, Date.now(), submission.submittedAt);
    submitFinal(registration.teamId, submission, feedback);
    toast.success("Pitch submitted — results are in");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">Submit &amp; pitch</h2>
        <p className="text-sm text-slate-600 mt-1">
          Share your demo, deck, and video, plus a short summary. Submission locks and judging runs immediately.
        </p>
      </div>

      <div className="space-y-5">
        {URL_FIELDS.map((f) => {
          const val = values[f.key];
          const invalid = val.trim().length > 0 && !isHttpUrl(val);
          return (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-800">{f.label}</label>
              <p className="text-xs text-slate-500 mb-1.5">{f.helper}</p>
              <input
                type="url"
                value={val}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder="https://"
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  invalid
                    ? "border-amber-400 focus:ring-amber-200"
                    : "border-slate-300 focus:ring-violet-200 focus:border-violet-400"
                }`}
              />
              {invalid && (
                <p className="text-xs text-amber-600 mt-1">Enter a valid http(s) URL.</p>
              )}
            </div>
          );
        })}

        <div>
          <label className="block text-sm font-medium text-slate-800">Summary</label>
          <p className="text-xs text-slate-500 mb-1.5">What you built and why it matters — at least {MIN_SUMMARY} characters.</p>
          <textarea
            rows={4}
            value={values.summary}
            onChange={(e) => setValues((p) => ({ ...p, summary: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${summaryValid ? "text-slate-400" : "text-amber-600"}`}>
              {values.summary.trim().length}/{MIN_SUMMARY} min
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`text-sm font-medium px-4 py-2 rounded-lg ${
            canSubmit
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Submit pitch
        </button>
      </div>
    </div>
  );
}
