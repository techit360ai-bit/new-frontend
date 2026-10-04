import { useEffect, useState } from 'react';
import { Plug } from 'lucide-react';
import { ConnectorCard } from '../components/connectors/ConnectorCard';
import { ConnectorDrawer } from '../components/connectors/ConnectorDrawer';
import { listConnectors, listActivity, disconnect } from '../lib/api/connectors';
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

  const handleDisconnect = async (c: Connector) => {
    try {
      const updated = await disconnect(c.id);
      if (updated) setConnectors((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connector update failed.');
    }
  };

  const handleCredentialChange = (updated: Connector) => {
    setConnectors((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  };

  const drawerActivity = selected ? activity.filter((a) => a.connectorId === selected.id) : [];

  return (
    <div className="h-full flex flex-col bg-background-primary">
      <div className="bg-surface-primary border-b border-border-default px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-lg"><Plug className="w-6 h-6 text-brand-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Connectors</h1>
            <p className="text-sm text-text-muted">{connectors.length} integrations • capabilities exposed to agents over MCP</p>
          </div>
        </div>
      </div>
      <div className="border-b border-border-default bg-status-warning-soft px-8 py-3 text-sm text-status-warning">
        Connectors are workspace-scoped: the secret is stored in this workspace&apos;s vault and never returned to the
        browser. GitHub can connect through the platform OAuth flow; other providers use an API key/token. Agents only
        reach a provider when they explicitly invoke a tool, and destructive tools route through the approval gate.
      </div>
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((c) => (
            <ConnectorCard key={c.id} connector={c} onOpen={handleOpen} onToggle={handleDisconnect} />
          ))}
          {connectors.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-dashed border-border-strong bg-surface-primary px-4 py-8 text-sm text-text-muted">
              {error ? `Live workspace connectors could not be loaded: ${error}` : 'No workspace connectors are recorded yet.'}
            </div>
          )}
        </div>
      </div>
      <ConnectorDrawer connector={selected} activity={drawerActivity} open={drawerOpen} onOpenChange={setDrawerOpen} onCredentialChange={handleCredentialChange} />
    </div>
  );
}
