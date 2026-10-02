import { CloudOff, Cloud, RefreshCw, Signal } from 'lucide-react';
import { useConnectivity } from '@/lib/resilience/ConnectivityProvider';

export function ConnectivityStatus() {
  const { state, syncing, pending } = useConnectivity();
  const label = state === 'offline' ? 'Offline - changes saved locally' : state === 'degraded' ? 'Limited connection' : syncing ? 'Syncing changes' : pending ? `${pending} changes waiting to sync` : 'Online';
  const Icon = state === 'offline' ? CloudOff : state === 'degraded' ? Signal : syncing ? RefreshCw : Cloud;
  return <div className="pointer-events-none fixed bottom-3 left-3 z-[90] inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-surface/95 px-2.5 py-1.5 text-[11px] text-text-secondary shadow-sm" aria-live="polite"><Icon className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />{label}</div>;
}
