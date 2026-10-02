import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { persistOnboardingCompletion } from "@/lib/onboarding";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { CollabProgressBar } from "./CollabProgressBar";

export function CollabStep6() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { collaboratorProfile, updateCollaboratorProfile } = useCollaboratorProfile();
  const [github, setGithub]       = useState(collaboratorProfile.links.github);
  const [linkedin, setLinkedin]   = useState(collaboratorProfile.links.linkedin);
  const [portfolio, setPortfolio] = useState(collaboratorProfile.links.portfolio);
  const [twitter, setTwitter]     = useState(collaboratorProfile.links.twitter);
  const [whyHere, setWhyHere]     = useState(collaboratorProfile.whyHere);
  const [pinned, setPinned]       = useState<string[]>(collaboratorProfile.pinnedWork);
  const [finishing, setFinishing] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const addPinned = () => { if (pinned.length < 3) setPinned((cur) => [...cur, ""]); };
  const removePinned = (i: number) => setPinned((cur) => cur.filter((_, idx) => idx !== i));
  const updatePinned = (i: number, val: string) => setPinned((cur) => cur.map((v, idx) => idx === i ? val : v));

  const persist = () => updateCollaboratorProfile({
    links: { github, linkedin, portfolio, twitter },
    whyHere,
    pinnedWork: pinned.filter((u) => u.trim()),
  });

  const handleFinish = async () => {
    if (finishing) return;
    updateCollaboratorProfile({
      links: { github, linkedin, portfolio, twitter },
      whyHere,
      pinnedWork: pinned.filter((u) => u.trim()),
    });
    setFinishing(true);
    setCompletionError(null);
    try {
      await persistOnboardingCompletion(updateProfile);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "Profile update failed.");
      setFinishing(false);
      toast.error("Onboarding could not be completed. Please try again.");
      return;
    }
    updateCollaboratorProfile({ onboardingComplete: true });
    toast.success("You're in. Welcome to TechIT.");
    navigate(roleDashboardPath.collaborator, { replace: true });
  };

  const handleBack = () => { persist(); navigate("/collaborator/onboarding/step-5"); };
  const handleSaveExit = () => { persist(); navigate("/collaborator/dashboard"); };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <button onClick={handleSaveExit} className="text-sm text-text-muted hover:text-text-primary">Save & exit</button>
        </div>
        <CollabProgressBar currentStep={6} totalSteps={6} />

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Portfolio & goals</h1>
          <p className="text-base text-text-muted">All optional — but the more you share, the better your matches.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">GitHub</label>
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">LinkedIn</label>
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">Portfolio</label>
            <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yoursite.com"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">Twitter / X</label>
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username"
              className="w-full h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">
              Why are you here? <span className="text-text-disabled font-normal">({whyHere.length}/200)</span>
            </label>
            <textarea
              value={whyHere} onChange={(e) => setWhyHere(e.target.value)} maxLength={200} rows={3}
              placeholder="What kind of product do you want to build equity in?"
              className="w-full bg-surface-primary border-2 border-border-strong rounded-lg px-4 py-3 text-base outline-none focus:border-status-warning transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-text-secondary">Pinned work (up to 3 links)</label>
            <div className="space-y-2">
              {pinned.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url} onChange={(e) => updatePinned(i, e.target.value)}
                    placeholder="https://project-url.com"
                    className="flex-1 h-12 bg-surface-primary border-2 border-border-strong rounded-lg px-4 text-base outline-none focus:border-status-warning transition-colors"
                  />
                  <button type="button" onClick={() => removePinned(i)}
                    className="h-12 w-12 rounded-lg border-2 border-border-strong text-text-muted hover:border-status-error hover:text-status-error transition-colors flex items-center justify-center text-lg">
                    ×
                  </button>
                </div>
              ))}
            </div>
            {pinned.length < 3 && (
              <button type="button" onClick={addPinned}
                className="mt-2 text-sm text-status-warning hover:text-status-warning font-semibold transition-colors">
                + Add link
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-10">
          <button onClick={handleBack} className="px-6 py-3 rounded-lg text-text-secondary hover:bg-surface-secondary font-semibold transition-colors">← Back</button>
          <button onClick={() => void handleFinish()} disabled={finishing}
            className="px-6 py-3 rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200 transition-colors">
            {finishing ? "Finishing..." : "Finish →"}
          </button>
        </div>
        {completionError && (
          <p role="alert" className="mt-3 text-right text-sm text-status-error">
            {completionError}
          </p>
        )}
      </div>
    </div>
  );
}
