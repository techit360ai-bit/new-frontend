import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { CollabProgressBar } from "./CollabProgressBar";

const SUGGESTIONS = ["TypeScript", "tRPC", "Tailwind", "Redis", "Playwright", "Jest", "Figma", "Postgres"];

export function CollabStep3() {
  const navigate = useNavigate();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [stack, setStack] = useState<string[]>(collaboratorProfile.techStack);
  const [draft, setDraft] = useState("");

  const addChip = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed || stack.includes(trimmed)) { setDraft(""); return; }
    setStack((cur) => [...cur, trimmed]);
    setDraft("");
  };
  const removeChip = (s: string) => setStack((cur) => cur.filter((x) => x !== s));
  const canContinue = stack.length >= 3;

  const persist = () => updateCollaboratorProfile({ techStack: stack });
  const handleNext = () => { persist(); navigate("/collaborator/onboarding/step-4"); };
  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-2"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

  const suggestions = SUGGESTIONS.filter((s) => !stack.includes(s)).slice(0, 8);

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <button onClick={handleSaveExit} className="text-sm text-text-muted hover:text-text-primary">Save & exit</button>
        </div>
        <CollabProgressBar currentStep={3} totalSteps={6} />

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Tech stack & tools</h1>
          <p className="text-base text-text-muted">Add at least 3. Hit Enter or click + to add.</p>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {stack.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-warning-soft border border-status-warning text-status-warning text-sm font-medium">
                {s}
                <button type="button" onClick={() => removeChip(s)} className="text-status-warning hover:text-status-warning leading-none">×</button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(draft); } }}
              placeholder="e.g. Next.js"
              className="flex-1 h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors"
            />
            <button type="button" onClick={() => addChip(draft)}
              className="h-12 w-12 rounded-lg bg-status-warning text-text-primary font-bold text-xl hover:bg-amber-400 transition-colors flex items-center justify-center">
              +
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-semibold text-text-muted mb-3">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => addChip(s)}
                  className="px-3 py-1.5 rounded-full border border-border-strong bg-surface-primary text-text-muted text-sm hover:border-status-warning transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          <button onClick={handleBack} className="px-6 py-3 rounded-lg text-text-secondary hover:bg-surface-secondary font-semibold transition-colors">← Back</button>
          <button onClick={handleNext} disabled={!canContinue}
            className="px-6 py-3 rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400 disabled:bg-slate-200 disabled:text-text-disabled disabled:cursor-not-allowed transition-colors">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
