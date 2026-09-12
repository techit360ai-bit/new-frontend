import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { Building2, MapPin, Globe, Hash, Calendar } from "lucide-react";

const orgTypes = [
  "Accelerator",
  "Incubator",
  "University",
  "Innovation Hub",
  "Corporate",
  "Foundation",
  "Government Agency",
  "Non-profit",
];

export function OrgStep1() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [orgName, setOrgName] = useState(orgProfile.orgName);
  const [orgType, setOrgType] = useState(orgProfile.orgType);
  const [location, setLocation] = useState(orgProfile.location);
  const [registrationNumber, setRegistrationNumber] = useState(
    orgProfile.registrationNumber,
  );
  const [foundingYear, setFoundingYear] = useState(orgProfile.foundingYear);
  const [website, setWebsite] = useState(orgProfile.website);
  const [finishing, setFinishing] = useState(false);

  const handleNext = async () => {
    updateOrgProfile({
      orgName,
      orgType,
      location,
      registrationNumber,
      foundingYear,
      website,
    });
    setFinishing(true);
    const { error } = await updateProfile({ isOnboarded: true });
    if (error) { setFinishing(false); return; }
    localStorage.setItem("techit_profile_completion_pending", "organisation");
    navigate(roleDashboardPath.org, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#20C997]/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            Organisation Identity
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Just the essentials to get started. Complete the rest from your profile later.
          </p>
        </div>

        <div className="space-y-7">
          <Field label="Organisation name" icon={Building2}>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Lagos Innovation Hub"
              className="w-full h-14 bg-white dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-5 text-base text-slate-900 dark:text-white outline-none focus:border-[#20C997] transition-colors"
            />
          </Field>

          <div>
            <label className="block mb-3 text-slate-900 dark:text-white font-semibold">
              Organisation type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {orgTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setOrgType(t)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                    orgType === t
                      ? "border-[#20C997] bg-[#20C997]/10 dark:bg-[#20C997]/20 text-[#20C997]"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-[#20C997]/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Headquarters" icon={MapPin}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, country"
                className="w-full h-14 bg-white dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-5 text-base text-slate-900 dark:text-white outline-none focus:border-[#20C997] transition-colors"
              />
            </Field>
            <Field label="Website" icon={Globe}>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full h-14 bg-white dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-5 text-base text-slate-900 dark:text-white outline-none focus:border-[#20C997] transition-colors"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Registration number" icon={Hash}>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Government-issued ID"
                className="w-full h-14 bg-white dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-5 text-base text-slate-900 dark:text-white outline-none focus:border-[#20C997] transition-colors"
              />
            </Field>
            <Field label="Founding year" icon={Calendar}>
              <input
                type="number"
                value={foundingYear || ""}
                onChange={(e) =>
                  setFoundingYear(parseInt(e.target.value) || 0)
                }
                min={1900}
                max={new Date().getFullYear()}
                placeholder="e.g. 2018"
                className="w-full h-14 bg-white dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-5 text-base text-slate-900 dark:text-white outline-none focus:border-[#20C997] transition-colors"
              />
            </Field>
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!orgName.trim() || !orgType || !location.trim() || finishing}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-[#20C997] to-emerald-600 hover:from-[#1ba87e] hover:to-emerald-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {finishing ? "Setting up…" : "Finish & go to dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-semibold">
        <Icon className="w-4 h-4 text-[#20C997]" />
        {label}
      </label>
      {children}
    </div>
  );
}
