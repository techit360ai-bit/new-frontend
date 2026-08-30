import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgProfile } from "@/contexts/UserContext";
import { OrgProgressBar } from "./OrgProgressBar";
import {
  ShieldCheck,
  Upload,
  Mail,
  FileText,
  X,
  Info,
} from "lucide-react";

export function OrgStep2() {
  const navigate = useNavigate();
  const { orgProfile, updateOrgProfile } = useOrgProfile();
  const [docs, setDocs] = useState<string[]>(orgProfile.verificationDocs);
  const [emailDomain, setEmailDomain] = useState(orgProfile.businessEmailDomain);

  const addDoc = (name: string) =>
    setDocs((prev) => (prev.includes(name) ? prev : [...prev, name]));
  const removeDoc = (name: string) =>
    setDocs((prev) => prev.filter((d) => d !== name));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => addDoc(f.name));
  };

  const handleNext = () => {
    const status =
      docs.length > 0 && emailDomain.trim() ? "pending" : "unverified";
    updateOrgProfile({
      verificationDocs: docs,
      businessEmailDomain: emailDomain,
      verificationStatus: status,
    });
    navigate("/org/onboarding/step-3");
  };

  const handleBack = () => navigate("/org/onboarding/step-1");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <OrgProgressBar currentStep={2} totalSteps={5} />

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2 flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-brand-accent" />
            Verification
          </h1>
          <p className="text-base text-text-muted dark:text-text-disabled">
            Verified organisations get a trust badge across the platform and can
            post Opportunities, run Hackathons, and broadcast to builders.
          </p>
        </div>

        <div className="space-y-7">
          {/* Document upload */}
          <div>
            <label className="block mb-3 text-text-primary dark:text-white font-semibold">
              Registration documents
            </label>
            <p className="text-sm text-text-muted dark:text-text-disabled mb-3">
              Upload your business registration certificate, tax ID or
              equivalent government-issued document.
            </p>
            <label
              htmlFor="org-docs-input"
              className="block w-full border-2 border-dashed border-border-strong dark:border-border-inverse-strong rounded-xl p-8 text-center cursor-pointer hover:border-brand-accent hover:bg-status-info-soft/50 dark:hover:bg-status-info-soft/5 transition-colors"
            >
              <input
                id="org-docs-input"
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <Upload className="w-8 h-8 text-brand-accent mx-auto mb-2" />
              <p className="text-sm font-semibold text-text-primary dark:text-white">
                Click to upload documents
              </p>
              <p className="text-xs text-text-muted dark:text-text-disabled mt-1">
                PDF, PNG, JPG or DOC up to 10MB each
              </p>
            </label>

            {docs.length > 0 && (
              <ul className="mt-3 space-y-2">
                {docs.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-3 bg-surface-primary dark:bg-surface-inverse-muted/60 border border-border-default dark:border-border-inverse-strong rounded-lg px-4 py-2.5"
                  >
                    <FileText className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span className="text-sm text-text-secondary dark:text-text-on-inverse-secondary flex-1 truncate">
                      {d}
                    </span>
                    <button
                      onClick={() => removeDoc(d)}
                      className="text-text-disabled hover:text-status-error transition-colors"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Business email domain */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-text-primary dark:text-white font-semibold">
              <Mail className="w-4 h-4 text-brand-accent" />
              Business email domain
            </label>
            <p className="text-sm text-text-muted dark:text-text-disabled mb-3">
              We'll send a verification email and check that your admin contacts
              use this domain.
            </p>
            <div className="flex items-center bg-surface-primary dark:bg-surface-inverse-muted/60 border-2 border-border-strong dark:border-border-inverse-strong rounded-xl px-5 h-14 focus-within:border-brand-accent transition-colors">
              <span className="text-text-muted dark:text-text-disabled text-base">
                @
              </span>
              <input
                type="text"
                value={emailDomain}
                onChange={(e) =>
                  setEmailDomain(e.target.value.toLowerCase().trim())
                }
                placeholder="yourcompany.org"
                className="flex-1 bg-transparent border-0 outline-none text-base text-text-primary dark:text-white px-2"
              />
            </div>
          </div>

          {/* Note */}
          <div className="bg-status-info-soft dark:bg-indigo-950/40 border border-brand-accent dark:border-indigo-800/50 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-accent dark:text-brand-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900 dark:text-brand-accent">
              <p className="font-semibold mb-1">
                Verification takes 1–3 business days
              </p>
              <p className="text-brand-accent dark:text-brand-accent">
                You can still finish onboarding and explore the dashboard.
                Posting Opportunities to the public Board requires a verified
                badge.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-4 rounded-xl border-2 border-border-strong dark:border-border-inverse-strong text-text-secondary dark:text-text-on-inverse-secondary font-semibold hover:border-brand-accent transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:from-brand-accent hover:to-violet-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
