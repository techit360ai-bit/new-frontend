import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export function ProfileCompletionBanner({ role, profilePath }: { role: string; profilePath: string }) {
  const storageKey = "techit_profile_completion_pending";
  const [visible, setVisible] = useState(() => localStorage.getItem(storageKey) === role);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.removeItem(storageKey);
    setVisible(false);
  };

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <span className="flex-1">Your account is ready. Complete your profile to improve matches and visibility.</span>
      <Link to={profilePath} className="font-semibold underline underline-offset-2">Complete profile</Link>
      <button onClick={dismiss} aria-label="Dismiss profile reminder" className="rounded p-1 hover:bg-amber-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
