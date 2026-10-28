import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Upload, ShieldCheck } from 'lucide-react'
import { createEvidenceUpload, finalizeEvidenceUpload, getVerification, requestVerification, submitEvidence } from '@/lib/api/authorization'

export function VerificationCenter() {
  const { role = 'investor' } = useParams(); const [search] = useSearchParams(); const [data, setData] = useState<any>(null); const [requestId, setRequestId] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const load = useCallback(() => getVerification(role).then(value => { setData(value); setRequestId(String(value.requests.find((row: any) => ['pending', 'in_review'].includes(row.status))?.id || '')) }), [role])
  useEffect(() => { void load() }, [load])
  const start = async () => { setBusy(true); try { const result = await requestVerification(role, search.get('capability') || undefined); setRequestId(result.request.id); await load() } finally { setBusy(false) } }
  const upload = async (file?: File) => { if (!file || !requestId) return; setBusy(true); setMessage('Scanning your evidence securely…'); try { const signed = await createEvidenceUpload(requestId, { contentType: file.type, sizeBytes: file.size }); await fetch(signed.uploadUrl, { method: 'PUT', headers: signed.requiredHeaders, body: file }); await finalizeEvidenceUpload(signed.object.id); await submitEvidence(requestId, { method: 'official_document', metadata: { objectId: signed.object.id, fileName: file.name } }); setMessage('Evidence uploaded and queued for review.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed') } finally { setBusy(false) } }
  const assurance = String(data?.profile?.assurance || 'CLAIMED')
  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white"><div className="mx-auto max-w-3xl space-y-6">
    <header><div className="flex items-center gap-3"><ShieldCheck className="text-emerald-400" /><h1 className="text-2xl font-bold capitalize">{role} verification</h1></div><p className="mt-2 text-slate-400">Verify progressively to unlock higher-assurance capabilities. Your evidence remains private.</p></header>
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex justify-between"><span>Current assurance</span><strong className="text-emerald-400">{assurance.replaceAll('_', ' ')}</strong></div><div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(10, ['CLAIMED','PROFILED','PARTIALLY_VERIFIED','VERIFIED','TRUSTED','INSTITUTIONAL'].indexOf(assurance) * 20)}%` }} /></div></section>
    {!requestId ? <button disabled={busy} onClick={() => void start()} className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-black">Start verification</button> : <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">Choose evidence</h2><p className="mt-1 text-sm text-slate-400">PDF, PNG, JPEG or text up to 25 MB. Files are malware-scanned before review.</p><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 p-8 text-slate-200"><Upload /> Upload document<input disabled={busy} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden" onChange={event => void upload(event.target.files?.[0])} /></label></section>}
    {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm"><CheckCircle2 className="h-4 w-4" />{message}</div>}
  </div></main>
}
