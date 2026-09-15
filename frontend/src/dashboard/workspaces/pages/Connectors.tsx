import { useEffect, useState } from 'react';
import { Plug } from 'lucide-react';
import { ConnectorCard } from '../components/connectors/ConnectorCard';
import { ConnectorDrawer } from '../components/connectors/ConnectorDrawer';
import { listConnectors, listActivity, connect, disconnect } from '../lib/api/connectors';
import type { Connector, ActivityEvent } from '../lib/types';

export function Connectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [selected, setSelected] = useState<Connector | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([listConnectors(), listActivity()])
      .then(([connectorRows, activityRows]) => {
        if (!alive) return;
        setConnectors(connectorRows);
        setActivity(activityRows);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setConnectors([]);
        setActivity([]);
        setError(err instanceof Error ? err.message : 'Live workspace connectors are unavailable.');
      });
    return () => { alive = false; };
  }, []);

  const handleOpen = (c: Connector) => { setSelected(c); setDrawerOpen(true); };

  const handleToggle = async (c: Connector) => {
    try {
      const updated = c.status === 'connected' ? await disconnect(c.id) : await connect(c.id);
      if (updated) setConnectors((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connector update failed.');
    }
  };

  const drawerActivity = selected ? activity.filter((a) => a.connectorId === selected.id) : [];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors">
      <div className="bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#20C997]/10 rounded-xl border border-[#20C997]/20"><Plug className="w-6 h-6 text-[#20C997]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Connectors</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{connectors.length} integrations • capabilities exposed to agents over MCP</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((c) => (
            <ConnectorCard key={c.id} connector={c} onOpen={handleOpen} onToggle={handleToggle} />
          ))}
          {connectors.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
              {error ? `Live workspace connectors could not be loaded: ${error}` : 'No workspace connectors are recorded yet.'}
            </div>
          )}
        </div>
      </div>
      <ConnectorDrawer connector={selected} activity={drawerActivity} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
