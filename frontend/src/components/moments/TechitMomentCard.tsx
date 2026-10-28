import { useState } from 'react';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import type { TechitMoment } from '@/lib/api/moments';
import { shareMoment } from '@/lib/api/moments';

export function TechitMomentCard({ moment, publicView = false }: { moment: TechitMoment; publicView?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const share = async (channel: string) => {
    setBusy(true);
    try {
      const result = await shareMoment(moment.id, channel);
      if (result.channelUrl && channel !== 'instagram') window.open(result.channelUrl, '_blank', 'noopener,noreferrer');
      else if (navigator.clipboard) await navigator.clipboard.writeText(`${result.shareText} ${result.publicUrl}`);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } finally { setBusy(false); }
  };
  const copy = async () => { if (navigator.clipboard) await navigator.clipboard.writeText(moment.publicUrl); await share('copy'); };
  return <article className="relative overflow-hidden rounded-xl border border-border-default bg-card p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary">TechIT Moment · {moment.role}</p><h2 className="mt-2 text-2xl font-semibold text-text-primary">{moment.title}</h2><p className="mt-2 text-sm text-text-muted">{moment.subtitle}</p></div><Share2 className="h-5 w-5 shrink-0 text-accent-primary" aria-hidden="true" /></div>
    <p className="mt-5 text-sm leading-6 text-text-primary">{moment.body}</p>
    {moment.metrics.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{moment.metrics.map(metric => <div key={metric.key} className="rounded-lg border border-border-default bg-background p-3"><p className="text-2xl font-semibold text-text-primary">{metric.value}</p><p className="mt-1 text-xs text-text-muted">{metric.label}</p></div>)}</div>}
    {!publicView && <div className="mt-6 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void copy()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm font-medium hover:border-accent-primary"><Copy className="h-4 w-4" />{copied ? 'Copied' : 'Copy link'}</button><button type="button" onClick={() => void share('linkedin')} disabled={busy} className="rounded-lg border border-border-default px-3 py-2 text-sm hover:border-accent-primary">LinkedIn</button><button type="button" onClick={() => void share('x')} disabled={busy} className="rounded-lg border border-border-default px-3 py-2 text-sm hover:border-accent-primary">X</button><button type="button" onClick={() => void share('whatsapp')} disabled={busy} className="rounded-lg border border-border-default px-3 py-2 text-sm hover:border-accent-primary">WhatsApp</button><button type="button" onClick={() => void share('facebook')} disabled={busy} className="rounded-lg border border-border-default px-3 py-2 text-sm hover:border-accent-primary">Facebook</button><button type="button" onClick={() => void share('instagram')} disabled={busy} className="rounded-lg border border-border-default px-3 py-2 text-sm hover:border-accent-primary">Instagram</button><a href={moment.publicUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm text-accent-primary">Open public card <ExternalLink className="h-4 w-4" /></a></div>}
    {copied && <span className="absolute right-5 bottom-5 inline-flex items-center gap-1 text-xs text-score-green"><Check className="h-3 w-3" />Shared link ready</span>}
  </article>;
}
