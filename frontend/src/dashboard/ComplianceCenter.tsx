import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createDataRequest, eraseMyData, exportMyData, fetchResidency, saveResidency } from '@/lib/api/compliance';
import { ShieldCheck, Download, FileText, Globe, Trash2 } from 'lucide-react';

export default function ComplianceCenter() {
  const [region, setRegion] = useState('eu');
  const [transfers, setTransfers] = useState(false);

  useEffect(() => {
    void fetchResidency().then(({ residency }) => {
      setRegion(residency?.region || 'eu');
      setTransfers(Boolean(residency?.internationalTransfers));
    });
  }, []);

  const download = async () => {
    const data = await exportMyData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'techit-personal-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy and Compliance</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage consent, data rights, residency, and account deletion.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Data Rights</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Request a full copy of your personal data or file an official data access request.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => void download().catch(e => toast.error(e.message))}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            <Download className="h-4 w-4" />
            Download My Data
          </button>
          <button
            onClick={() => void createDataRequest({ type: 'access', details: 'User requested access through Compliance Center' }).then(() => toast.success('Request recorded'))}
            className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all"
          >
            <FileText className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
            Submit Access Request
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Residency</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Primary Region</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0066ff] focus:outline-none"
            >
              <option value="eu">European Union</option>
              <option value="africa">Africa</option>
              <option value="global">Global</option>
            </select>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={transfers}
              onChange={e => setTransfers(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0066ff] focus:ring-[#0066ff] accent-[#0066ff]"
            />
            Allow international transfers with an approved mechanism
          </label>
          <button
            onClick={() => void saveResidency({ region, internationalTransfers: transfers, transferMechanism: transfers ? 'contractual_safeguards' : null }).then(() => toast.success('Residency preference saved'))}
            className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all"
          >
            Save Preference
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Erase Account Data</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">This permanently removes records owned by your account and cannot be undone.</p>
        <button
          onClick={() => {
            if (window.confirm('Permanently erase your TechIT account data?')) void eraseMyData().then(() => window.location.assign('/signin'));
          }}
          className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all"
        >
          Erase My Data
        </button>
      </section>
    </main>
  );
}
