import { useCallback, useEffect, useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dismissMoment, getPendingMoment, shareMoment, type TechitMoment } from '@/lib/api/moments';
import { TechitMomentCard } from './TechitMomentCard';

const channels = [
  ['linkedin', 'LinkedIn'], ['x', 'X'], ['whatsapp', 'WhatsApp'],
  ['facebook', 'Facebook'], ['telegram', 'Telegram'], ['instagram', 'Instagram'], ['copy', 'Copy link'],
] as const;

export function TechitMomentPrompt() {
  const { user, loading } = useAuth(); const location = useLocation();
  const [moment, setMoment] = useState<TechitMoment | null>(null); const [choosing, setChoosing] = useState(false); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const check = useCallback(() => {
    if (!user || loading || location.pathname.startsWith('/moments/')) return;
    void getPendingMoment().then(result => setMoment(current => current || result.moment)).catch(() => undefined);
  }, [loading, location.pathname, user]);

  useEffect(() => {
    check(); const interval = window.setInterval(check, 60_000); return () => window.clearInterval(interval);
  }, [check]);

  if (!moment) return null;
  const cancel = async () => { setBusy(true); try { await dismissMoment(moment.id); setMoment(null); setChoosing(false); } finally { setBusy(false); } };
  const send = async (channel: string) => {
    setBusy(true);
    try {
      const result = await shareMoment(moment.id, channel);
      if (result.channelUrl) window.open(result.channelUrl, '_blank', 'noopener,noreferrer');
      else if (navigator.clipboard) await navigator.clipboard.writeText(`${result.shareText} ${result.publicUrl}`);
      setSent(true); window.setTimeout(() => { setMoment(null); setChoosing(false); setSent(false); }, 1200);
    } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Share your TechIT Moment">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-sm font-semibold text-foreground">You reached a TechIT Moment</p><p className="text-xs text-muted-foreground">Share it now or dismiss this card.</p></div><button type="button" onClick={() => void cancel()} disabled={busy} aria-label="Cancel Moment" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
      <div className="p-4 sm:p-5"><TechitMomentCard moment={moment} publicView />
        {choosing ? <div className="mt-4"><p className="mb-3 text-sm font-medium text-foreground">Send with</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{channels.map(([channel, label]) => <button key={channel} type="button" disabled={busy} onClick={() => void send(channel)} className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:border-primary disabled:opacity-50">{label}</button>)}</div></div> : <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => void cancel()} disabled={busy} className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium">Cancel</button><button type="button" onClick={() => setChoosing(true)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Send className="h-4 w-4" />Send</button></div>}
        {sent && <p className="mt-3 flex items-center justify-end gap-1 text-sm text-status-success"><Check className="h-4 w-4" />Moment ready to share</p>}
      </div>
    </div>
  </div>;
}
