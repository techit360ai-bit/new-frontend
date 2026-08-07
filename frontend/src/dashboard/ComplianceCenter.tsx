import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createDataRequest, eraseMyData, exportMyData, fetchResidency, saveResidency } from '@/lib/api/compliance';

export default function ComplianceCenter() {
  const [region, setRegion] = useState('eu');
  const [transfers, setTransfers] = useState(false);
  useEffect(() => { void fetchResidency().then(({ residency }) => { setRegion(residency?.region || 'eu'); setTransfers(Boolean(residency?.internationalTransfers)); }); }, []);
  const download = async () => {
    const data = await exportMyData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'techit-personal-data.json'; link.click(); URL.revokeObjectURL(url);
  };
  return <main className="mx-auto max-w-3xl space-y-8 p-6">
    <div><h1 className="text-2xl font-bold">Privacy and compliance</h1><p className="mt-1 text-sm text-slate-600">Manage consent, data rights, residency, and account deletion.</p></div>
    <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Your data rights</h2>
      <div className="flex flex-wrap gap-3"><button onClick={() => void download().catch(e => toast.error(e.message))} className="rounded-md bg-violet-600 px-4 py-2 text-sm text-white">Download my data</button>
      <button onClick={() => void createDataRequest({ type: 'access', details: 'User requested access through Compliance Center' }).then(() => toast.success('Request recorded'))} className="rounded-md border px-4 py-2 text-sm">Submit access request</button></div>
    </section>
    <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Data residency</h2>
      <select value={region} onChange={e => setRegion(e.target.value)} className="rounded-md border bg-transparent px-3 py-2"><option value="eu">European Union</option><option value="africa">Africa</option><option value="global">Global</option></select>
      <label className="ml-4 text-sm"><input type="checkbox" checked={transfers} onChange={e => setTransfers(e.target.checked)} className="mr-2" />Allow international transfers with an approved mechanism</label>
      <button onClick={() => void saveResidency({ region, internationalTransfers: transfers, transferMechanism: transfers ? 'contractual_safeguards' : null }).then(() => toast.success('Residency preference saved'))} className="block rounded-md border px-4 py-2 text-sm">Save preference</button>
    </section>
    <section className="space-y-3 border-t border-red-200 pt-5"><h2 className="font-semibold text-red-700">Erase account data</h2><p className="text-sm text-slate-600">This permanently removes records owned by your account and cannot be undone.</p>
      <button onClick={() => { if (window.confirm('Permanently erase your TechIT account data?')) void eraseMyData().then(() => window.location.assign('/signin')); }} className="rounded-md bg-red-600 px-4 py-2 text-sm text-white">Erase my data</button>
    </section>
  </main>;
}
