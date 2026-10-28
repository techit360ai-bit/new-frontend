import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface DataSaverValue { enabled: boolean; setEnabled: (enabled: boolean) => void }
const Context = createContext<DataSaverValue>({ enabled: false, setEnabled: () => undefined });
const KEY = 'techit-data-saver';

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const setEnabled = (next: boolean) => { setEnabledState(next); try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* storage unavailable */ } };
  useEffect(() => {
    document.documentElement.toggleAttribute('data-data-saver', enabled);
    if (!enabled) return;
    const apply = (root: ParentNode = document) => {
      root.querySelectorAll?.('img:not([data-essential]), video:not([data-essential])').forEach((node) => {
        if (node instanceof HTMLImageElement) { node.loading = 'lazy'; node.decoding = 'async'; }
        if (node instanceof HTMLVideoElement) { node.preload = 'none'; node.autoplay = false; }
      });
    };
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDataSaver(): DataSaverValue { return useContext(Context); }
