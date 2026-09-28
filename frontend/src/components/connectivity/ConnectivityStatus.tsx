import { CloudOff, Cloud, RefreshCw, Signal } from 'lucide-react';
import { useConnectivity } from '@/lib/resilience/ConnectivityProvider';

export function ConnectivityStatus() {
  const { state, syncing, pending } = useConnectivity();
  const label = state === 'offline' ? 'Offline - changes saved locally' : state === 'degraded' ? 'Limited connection' : syncing ? 'Syncing changes' : pending ? `${pending} changes waiting to sync` : 'Online';
  const Icon = state === 'offline' ? CloudOff : state === 'degraded' ? Signal : syncing ? RefreshCw : Cloud;
  return <div className="pointer-events-none fixed bottom-4 left-4 z-[90] inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 text-xs text-slate-200 shadow-2xl" aria-live="polite"><Icon className={`h-3.5 w-3.5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />{label}</div>;
}
