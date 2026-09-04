import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface DataSaverValue { enabled: boolean; setEnabled: (enabled: boolean) => void }
const Context = createContext<DataSaverValue>({ enabled: false, setEnabled: () => undefined });
const KEY = 'techit-data-saver';

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const setEnabled = (next: boolean) => { setEnabledState(next); try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* storage unavailable */ } };
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDataSaver(): DataSaverValue { return useContext(Context); }
