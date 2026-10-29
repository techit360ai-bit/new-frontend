import { fetchNotificationPreferences, saveNotificationPreferences } from "@/lib/api/settings";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Rocket, Users, ShieldCheck, Bell, Save, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExplorerLayout } from "../layout/ExplorerLayout";

export function ExplorerSettings() {
  const { profile, activateRole, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [interests, setInterests] = useState((profile?.industries || []).join(', '));
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const saveProfile = async () => {
    setProfileBusy(true); setProfileMessage("");
    try {
      const result = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), bio: bio.trim(), industries: interests.split(',').map(value => value.trim()).filter(Boolean) });
      setProfileMessage(result.error ? result.error.message : 'Profile saved.');
    } catch (cause) { setProfileMessage(cause instanceof Error ? cause.message : 'Profile could not be saved.'); }
    finally { setProfileBusy(false); }
  };

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true; setBusy(true); setError("");
    fetchNotificationPreferences<{ email: boolean; inApp: boolean }>("explorer")
      .then(prefs => { if (alive) { setEmailNotifs(prefs.email ?? true); setInAppNotifs(prefs.inApp ?? true); setLoaded(true); } })
      .catch(() => { if (alive) setError("Preferences could not be loaded. Please reload before saving."); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [loadRevision]);
  const handleSave = async () => {
    setBusy(true); setSaved(false); setError("");
    try { await saveNotificationPreferences("explorer", { email: emailNotifs, inApp: inAppNotifs }); setSaved(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Preferences could not be saved."); }
    finally { setBusy(false); }
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
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#20C997]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Operating Context</h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are currently exploring TechIT in <strong className="text-[#20C997]">Explorer Mode</strong>. Activate a specialized mode to start recruiting or accepting build tasks.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => void activateRole("founder")}
              className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:border-[#20C997] hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Founder Mode</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Post startups, create workspaces, hire team</span>
              </div>
              <Rocket className="h-4 w-4 text-[#20C997] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => void activateRole("collaborator")}
              className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:border-[#20C997] hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Collaborator Mode</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Join build projects, earn cash & equity</span>
              </div>
              <Users className="h-4 w-4 text-[#20C997] shrink-0" />
            </button>
          </div>
        </div>

        {error && <div role="alert" className="text-sm text-red-600 dark:text-red-400">{error}{!loaded && <button type="button" onClick={() => setLoadRevision(value => value + 1)} className="ml-3 min-h-11 rounded-xl border border-current px-4">Retry loading preferences</button>}</div>}
        <form onSubmit={event => { event.preventDefault(); void saveProfile(); }} className="space-y-4 rounded-3xl border border-black/[0.08] bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-[#111111]/90">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Explorer profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First name<input required value={firstName} onChange={event => setFirstName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 dark:border-white/10" /></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last name<input value={lastName} onChange={event => setLastName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 dark:border-white/10" /></label>
          </div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Bio<textarea value={bio} onChange={event => setBio(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-black/10 bg-transparent p-3 dark:border-white/10" /></label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Interests, separated by commas<input value={interests} onChange={event => setInterests(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 dark:border-white/10" /></label>
          {profileMessage && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{profileMessage}</p>}
          <button type="submit" disabled={profileBusy} className="min-h-11 rounded-xl bg-[#20C997] px-4 text-sm font-bold text-slate-950 disabled:opacity-50">{profileBusy ? 'Saving profile...' : 'Save profile'}</button>
        </form>

        {/* Notifications Card */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#20C997]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Email digests for matching startups & opportunities</span>
              <input
                type="checkbox"
                checked={emailNotifs}
                disabled={busy}
                onChange={(e) => { setSaved(false); setEmailNotifs(e.target.checked); }}
                className="h-4 w-4 rounded border-slate-300 text-[#20C997] focus:ring-[#20C997]"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">In-app notifications for event reminders & messages</span>
              <input
                type="checkbox"
                checked={inAppNotifs}
                disabled={busy}
                onChange={(e) => { setSaved(false); setInAppNotifs(e.target.checked); }}
                className="h-4 w-4 rounded border-slate-300 text-[#20C997] focus:ring-[#20C997]"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={busy || !loaded}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{busy ? "Please wait..." : saved ? "Preferences Saved" : "Save Preferences"}</span>
            </button>
          </div>
        </div>
      </div>
    </ExplorerLayout>
  );
}
