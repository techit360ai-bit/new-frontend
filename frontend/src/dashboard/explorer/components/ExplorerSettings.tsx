import { useState } from "react";
import { Settings as SettingsIcon, Rocket, Users, ShieldCheck, Bell, Save, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExplorerLayout } from "../layout/ExplorerLayout";

export function ExplorerSettings() {
  const { profile, activateRole } = useAuth();
  const [saved, setSaved] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-4xl mx-auto font-bricolage">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Explorer Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage your operating context, interest tags, and notification preferences.</p>
        </div>

        {/* Operational Modes Activation Card */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Operating Context</h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are currently exploring TechIT in <strong className="text-[#0066ff] dark:text-[#58a6ff]">Explorer Mode</strong>. Activate a specialized mode to start recruiting or accepting build tasks.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => void activateRole("founder")}
              className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:border-[#0066ff] hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Founder Mode</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Post startups, create workspaces, hire team</span>
              </div>
              <Rocket className="h-4 w-4 text-purple-500 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => void activateRole("collaborator")}
              className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:border-[#0066ff] hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Collaborator Mode</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Join build projects, earn cash & equity</span>
              </div>
              <Users className="h-4 w-4 text-[#0066ff] shrink-0" />
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Email digests for matching startups & opportunities</span>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0066ff] focus:ring-[#0066ff]"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">In-app notifications for event reminders & messages</span>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0066ff] focus:ring-[#0066ff]"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md hover:opacity-95"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{saved ? "Preferences Saved" : "Save Preferences"}</span>
            </button>
          </div>
        </div>
      </div>
    </ExplorerLayout>
  );
}
