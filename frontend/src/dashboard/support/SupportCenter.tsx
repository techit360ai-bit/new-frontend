import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, LifeBuoy, Plus, Send, TicketCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { createSupportCase, getSupportCase, listSupportCases, reopenSupportCase, replyToSupportCase, submitSupportFeedback, type SupportCase } from '@/lib/api/support';
import { useAuth } from '@/contexts/AuthContext';
import { authRoleDashboardPath } from '@/lib/roleRoutes';

const categories = [
  ['account', 'Account'], ['billing', 'Subscription & Billing'], ['credits', 'AI & Credits'],
  ['platform', 'Platform'], ['projects', 'Projects / Incubation'], ['privacy', 'Privacy'], ['security', 'Security'], ['other', 'Other'],
];

function dueLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Calculated by support policy' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SupportCenter() {
  const { profile, activeContext } = useAuth();
  const backPath = authRoleDashboardPath(activeContext?.role || profile?.role);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSupportCase>> | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'platform', subject: '', description: '' });
  const [reply, setReply] = useState('');
  const [rating, setRating] = useState(0);

  const load = () => listSupportCases().then(setCases).catch(() => toast.error('Support cases are temporarily unavailable.')).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (selected) getSupportCase(selected).then(setDetail).catch(() => toast.error('Unable to load this support case.')); }, [selected]);
  useEffect(() => {
    if (!selected || typeof EventSource === 'undefined') return;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const stream = new EventSource(`${base}/support/cases/${encodeURIComponent(selected)}/stream`, { withCredentials: true });
    stream.addEventListener('support_update', () => { void getSupportCase(selected).then(setDetail); void load(); });
    const fallback = window.setInterval(() => { void getSupportCase(selected).then(setDetail); }, 10000);
    return () => { stream.close(); window.clearInterval(fallback); };
  }, [selected]);

  const submit = async () => {
    try {
      const created = await createSupportCase(form);
      setCreating(false); setForm({ category: 'platform', subject: '', description: '' }); setSelected(created.id); await load();
      toast.success(`Complaint received. Case ${created.caseNumber} was created.`);
    } catch (error: any) {
      const existing = error?.body?.case as SupportCase | undefined;
      if (existing) { setSelected(existing.id); toast.info(`You already have open case ${existing.caseNumber}.`); }
      else toast.error('Unable to create the support case.');
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    await replyToSupportCase(selected, reply.trim()); setReply(''); setDetail(await getSupportCase(selected)); await load();
  };

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3"><Link to={backPath} aria-label="Back to dashboard" className="app-touch-target inline-flex items-center justify-center rounded-lg hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-sm font-semibold">Customer Care</p><p className="text-xs text-muted-foreground">Cases, updates, and responses</p></div></div>
        <button type="button" onClick={() => setCreating(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />New case</button>
      </div>
    </header>
    <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-border p-4 lg:min-h-[calc(100vh-56px)] lg:border-b-0 lg:border-r">
        <div className="mb-4"><h1 className="text-xl font-semibold">How can we help?</h1><p className="mt-1 text-sm text-muted-foreground">Every complaint receives a case ID and an SLA-based response estimate.</p></div>
        <div className="space-y-2">{loading && <p className="text-sm text-muted-foreground">Loading cases...</p>}{cases.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item.id); setCreating(false); }} className={`w-full rounded-lg border p-3 text-left ${selected === item.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-primary">{item.caseNumber}</span><span className="text-xs capitalize text-muted-foreground">{item.status.replaceAll('_', ' ')}</span></div><p className="mt-2 truncate text-sm font-medium">{item.subject}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.category} · {item.priority}</p></button>)}</div>
      </aside>
      <section className="p-4 sm:p-6">
        {creating ? <div className="mx-auto max-w-xl"><div className="mb-6 flex items-center gap-3"><LifeBuoy className="h-6 w-6 text-primary" /><div><h2 className="text-lg font-semibold">Create a support case</h2><p className="text-sm text-muted-foreground">Choose the closest category and describe what happened.</p></div></div><div className="space-y-4"><label className="block text-sm font-medium">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-medium">Subject<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} maxLength={180} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label><label className="block text-sm font-medium">What happened?<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={7} maxLength={4000} className="mt-1 w-full rounded-lg border border-input bg-background p-3" /></label><button type="button" disabled={!form.subject.trim() || !form.description.trim()} onClick={() => void submit()} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">Submit complaint</button></div></div> : detail ? <div className="mx-auto max-w-2xl"><div className="border-b border-border pb-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">{detail.case.caseNumber}</p><h2 className="mt-1 text-xl font-semibold">{detail.case.subject}</h2></div><span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium capitalize">{detail.case.status.split('_').join(' ')}</span></div><div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><span>Expected first response: {dueLabel(detail.case.firstResponseDueAt)}</span></div></div><div className="space-y-3 py-5">{detail.messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-lg p-3 text-sm ${message.senderType === 'customer' ? 'ml-auto bg-primary text-primary-foreground' : 'border border-border bg-muted/40'}`}><p className="mb-1 text-xs font-medium opacity-70">{message.senderType === 'customer' ? 'You' : message.senderType === 'admin' ? 'TechIT Support' : 'System'}</p><p className="whitespace-pre-wrap">{message.message}</p></div>)}</div>{detail.case.status === 'resolved' && <div className="rounded-lg border border-border p-4"><p className="text-sm font-medium">Was your issue resolved?</p><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`min-h-10 min-w-10 rounded border ${rating === value ? 'border-primary bg-primary/10' : 'border-border'}`}>{value}</button>)}<button type="button" disabled={!rating} onClick={() => void submitSupportFeedback(detail.case.id, { rating, resolutionStatus: rating >= 4 ? 'yes' : 'partial' }).then(() => toast.success('Thanks for your feedback.'))} className="rounded bg-primary px-3 text-sm text-primary-foreground">Send feedback</button></div><button type="button" onClick={() => void reopenSupportCase(detail.case.id).then((result) => { setDetail({ ...detail, case: result.case }); void load(); })} className="mt-3 text-sm text-primary">I still need help</button></div>}{!['closed'].includes(detail.case.status) && <div className="flex gap-2 border-t border-border pt-4"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} placeholder="Reply to this case" className="min-w-0 flex-1 rounded-lg border border-input bg-background p-3 text-sm" /><button type="button" onClick={() => void sendReply()} aria-label="Send reply" className="app-touch-target inline-flex items-center justify-center self-end rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button></div>}</div> : <div className="flex min-h-[50vh] flex-col items-center justify-center text-center"><TicketCheck className="h-10 w-10 text-primary" /><h2 className="mt-4 text-lg font-semibold">Your support history stays here</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Select an existing case or create a new one. You will always see who owns the next step and when a response is expected.</p></div>}
      </section>
    </div>
  </main>;
}
