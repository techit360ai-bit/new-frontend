import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed';
import { getConnectorCredential, removeConnectorCredential, setConnectorCredential, type ConnectorCredentialStatus } from '../../lib/api/connectors';
import type { Connector, ActivityEvent } from '../../lib/types';

interface Props {
  connector: Connector | null;
  activity: ActivityEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialChange?: (connector: Connector) => void;
}

export function ConnectorDrawer({ connector, activity, open, onOpenChange, onCredentialChange }: Props) {
  const [status, setStatus] = useState<ConnectorCredentialStatus | null>(null);
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!open || !connector) return () => { alive = false; };
    setToken(''); setError(null); setStatus(null);
    getConnectorCredential(connector.id)
      .then((row) => { if (alive) setStatus(row); })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Credential status is unavailable.'); });
    return () => { alive = false; };
  }, [open, connector]);

  const connect = async () => {
    if (!connector || !token.trim()) return;
    setSaving(true); setError(null);
    try {
      const updated = await setConnectorCredential(connector.id, { token: token.trim(), label: label.trim() || undefined });
      const next = await getConnectorCredential(connector.id);
      setStatus(next); setToken(''); setLabel('');
      if (updated) onCredentialChange?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credential could not be stored.');
    } finally { setSaving(false); }
  };

  const disconnect = async () => {
    if (!connector) return;
    setSaving(true); setError(null);
    try {
      const updated = await removeConnectorCredential(connector.id);
      setStatus({ credential: null, handshake: 'credential', oauthRedirectSupported: false });
      if (updated) onCredentialChange?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credential could not be removed.');
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        {connector && (
          <>
            <SheetHeader>
              <SheetTitle>{connector.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-6">
              <section>
                <h4 className="text-xs font-semibold uppercase text-text-disabled mb-2">Provider credential</h4>
                <div className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-start gap-2 text-xs text-text-muted">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                    <p>
                      This stores a provider token, sealed at rest with the platform encryption key, and keeps the raw value
                      out of the connector list. It is <strong>not</strong> a browser OAuth redirect — this deployment has
                      no OAuth callback endpoint.
                    </p>
                  </div>
                  {status?.credential ? (
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-sm text-status-success">
                        <CheckCircle2 className="h-4 w-4" /> Connected as <code className="text-xs">{status.credential.maskedIdentifier}</code>
                      </p>
                      <p className="text-xs text-text-muted">{status.credential.label} · since {new Date(status.credential.connectedAt).toLocaleString()}</p>
                      <Button variant="outline" disabled={saving} onClick={() => void disconnect()}>Remove credential</Button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs text-text-muted">Provider token / API key</label>
                      <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. ghp_… or xoxb-…" className="w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm" />
                      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className="w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm" />
                      <Button className="bg-brand-primary hover:bg-brand-primary-hover" disabled={saving || !token.trim()} onClick={() => void connect()}>
                        <KeyRound className="h-4 w-4 mr-1" /> {saving ? 'Storing…' : 'Store encrypted credential'}
                      </Button>
                    </div>
                  )}
                  {error && <p className="mt-2 text-xs text-status-error">{error}</p>}
                </div>
              </section>
              <div>
                <h4 className="text-xs font-semibold uppercase text-text-disabled mb-2">MCP Tools</h4>
                <ul className="space-y-2">
                  {connector.tools.map((t) => (
                    <li key={t.name} className="border border-border-subtle rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-medium">{t.name}</code>
                        {t.destructive && (
                          <Badge className="bg-status-error-soft text-status-error text-xs"><AlertTriangle className="w-3 h-3 mr-1" />approval</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1">{t.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-text-disabled mb-2">Resources</h4>
                <div className="flex flex-wrap gap-1.5">
                  {connector.resources.map((r) => (<Badge key={r} variant="secondary" className="text-xs">{r}</Badge>))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-text-disabled mb-2">Recent Activity</h4>
                <ActivityFeed events={activity} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
