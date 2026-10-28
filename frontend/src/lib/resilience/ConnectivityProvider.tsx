import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { currentConnectivity, type ConnectivityState } from './connectivity';
import { pendingOperations, replay } from './queue';
import { getAuthToken } from '@/lib/api/client';
import { useDataSaver } from '@/contexts/DataSaverContext';

interface ConnectivityContextValue { state: ConnectivityState; syncing: boolean; pending: number; refresh: () => Promise<void> }
const Context = createContext<ConnectivityContextValue>({ state: 'online', syncing: false, pending: 0, refresh: async () => undefined });

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectivityState>(currentConnectivity());
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const { enabled: dataSaver } = useDataSaver();
  const refresh = async () => { setState(currentConnectivity()); setPending((await pendingOperations()).length); };
  useEffect(() => {
    const update = () => { void refresh(); };
    window.addEventListener('online', update); window.addEventListener('offline', update);
    void update();
    const timer = window.setInterval(update, dataSaver ? 15000 : 5000);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.clearInterval(timer); };
  }, [dataSaver]);
  useEffect(() => {
    if (state !== 'online') return;
    setSyncing(true);
    void replay(async operation => {
      if (!operation.endpoint) return 'completed';
      const token = getAuthToken();
      const method = operation.method ?? 'POST';
      const response = await fetch(operation.endpoint, { method, headers: { 'Content-Type': 'application/json', 'X-TechIT-Operation-Id': operation.id, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(operation.headers ?? {}) }, body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(operation.payload) });
      if (response.status === 409) return 'conflict';
      if (!response.ok) throw new Error(`Sync failed (${response.status})`);
      return 'completed';
    }).then(result => setPending(result.remaining)).catch(() => undefined).finally(() => setSyncing(false));
  }, [state]);
  const value = useMemo(() => ({ state, syncing, pending, refresh }), [state, syncing, pending]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useConnectivity(): ConnectivityContextValue { return useContext(Context); }
