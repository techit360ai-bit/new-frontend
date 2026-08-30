import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Code2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createCollaboratorTool,
  fetchCollaboratorTools,
  patchCollaboratorTool,
  type CollaboratorToolIntegration,
  type CollaboratorToolWorkspace,
} from "@/lib/api/collaboratorTools";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const ADDITIONAL_TOOLS = ["Slack", "Sentry", "PostHog", "Stripe", "ClickUp", "Loom", "Cal.com", "Calendly"];

function formatLastSync(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Tools() {
  const navigate = useNavigate();
  const [toolList, setToolList] = useState<CollaboratorToolIntegration[]>([]);
  const [workspaces, setWorkspaces] = useState<CollaboratorToolWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState<CollaboratorToolIntegration | null>(null);
  const [manageOpen,  setManageOpen]  = useState<CollaboratorToolIntegration | null>(null);
  const [addOpen,     setAddOpen]     = useState(false);

  const loadTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchCollaboratorTools();
      setWorkspaces(snapshot.workspaces);
      setToolList(snapshot.tools);
    } catch (err) {
      setWorkspaces([]);
      setToolList([]);
      setError(err instanceof Error ? err.message : "Live tools are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  const handleConnect = async (tool: CollaboratorToolIntegration) => {
    setSaving(true);
    try {
      const updated = await patchCollaboratorTool(tool, {
        status: "connected",
        updates: Math.max(1, tool.updates),
        lastSyncedAt: new Date().toISOString(),
        scopes: tool.scopes.length === 0 ? ["repo:read"] : tool.scopes,
      });
      setToolList((cur) => cur.map((t) => t.id === updated.id && t.workspaceId === updated.workspaceId ? updated : t));
      setConnectOpen(null);
      toast(`Connected to ${tool.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect tool.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (tool: CollaboratorToolIntegration) => {
    setSaving(true);
    try {
      const updated = await patchCollaboratorTool(tool, {
        status: "disconnected",
        updates: 0,
        lastSyncedAt: null,
      });
      setToolList((cur) => cur.map((t) => t.id === updated.id && t.workspaceId === updated.workspaceId ? updated : t));
      setManageOpen(null);
      toast(`Disconnected from ${tool.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect tool.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTool = async (name: string) => {
    const workspace = workspaces[0];
    if (!workspace) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (toolList.some((t) => t.id === id && t.workspaceId === workspace.id)) {
      toast(`${name} is already in the list`);
      setAddOpen(false);
      return;
    }
    setSaving(true);
    try {
      const created = await createCollaboratorTool(workspace.id, name);
      setToolList((cur) => [...cur, { ...created, workspaceName: workspace.name }]);
      setAddOpen(false);
      toast(`Added ${name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add tool.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tools</h1>
          <p className="text-sm text-text-muted mt-0.5">Your build environment across projects.</p>
        </div>
        <button onClick={() => setAddOpen(true)} disabled={loading || workspaces.length === 0}
          className="h-9 px-3 bg-status-warning hover:bg-amber-400 text-text-primary rounded-lg text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Connect new tool
        </button>
      </div>

      {error && (
        <div className="border border-status-error bg-status-error-soft rounded-xl p-4">
          <p className="text-sm font-semibold text-status-error">Live tools are unavailable.</p>
          <p className="text-sm text-status-error mt-1">{error}</p>
          <button onClick={() => void loadTools()}
            className="mt-3 text-xs px-3 py-1.5 border border-status-error rounded-lg text-status-error hover:bg-status-error-soft">
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-cyan-200 bg-cyan-50 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3"><Code2 className="mt-0.5 h-6 w-6 text-cyan-700" /><div><h2 className="font-semibold text-text-primary">Code Editor</h2><p className="mt-1 text-sm text-text-muted">Write, run, test and improve the current project inside its existing TechIT Workspace.</p></div></div>
        <button onClick={() => navigate(`/workspaces/code${workspaces[0]?.id ? `?workspace=${encodeURIComponent(workspaces[0].id)}` : ''}`)} disabled={!workspaces.length} className="min-h-10 rounded-lg bg-background-inverse px-4 text-sm font-semibold text-white disabled:opacity-50">Open Code Editor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-text-muted md:col-span-3">Loading live tools...</p>}
        {!loading && !error && toolList.length === 0 && (
          <p className="text-sm text-text-muted md:col-span-3">No live tools are connected to your workspaces yet.</p>
        )}
        {toolList.map((t) => (
          <div key={`${t.workspaceId}:${t.id}`} className="border border-border-default bg-surface-primary rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{t.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "connected" ? "bg-status-success-soft text-status-success" : "bg-surface-secondary text-text-muted"}`}>{t.status}</span>
            </div>
            <p className="text-xs text-text-muted">Last sync: {formatLastSync(t.lastSyncedAt)}</p>
            <p className="text-xs text-text-muted mt-1">{t.updates} updates</p>
            <div className="mt-4">
              {t.status === "connected" ? (
                <button onClick={() => setManageOpen(t)} className="w-full text-xs px-3 py-1.5 border border-border-strong rounded-lg hover:bg-background-primary">Manage</button>
              ) : (
                <button onClick={() => setConnectOpen(t)} className="w-full text-xs px-3 py-1.5 bg-background-inverse text-white rounded-lg hover:bg-surface-inverse-muted">Connect</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connect dialog */}
      <Dialog open={connectOpen !== null} onOpenChange={(o) => !o && setConnectOpen(null)}>
        <DialogContent className="max-w-sm">
          {connectOpen && (
            <>
              <DialogHeader><DialogTitle>Connect to {connectOpen.name}</DialogTitle></DialogHeader>
              <p className="text-sm text-text-muted">Continue to grant workspace access for {connectOpen.name}.</p>
              <DialogFooter>
                <button onClick={() => setConnectOpen(null)} className="px-4 py-2 text-sm rounded-lg text-text-secondary hover:bg-surface-secondary">Cancel</button>
                <button onClick={() => void handleConnect(connectOpen)} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-status-warning text-text-primary font-semibold hover:bg-amber-400">Continue to {connectOpen.name}</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage dialog */}
      <Dialog open={manageOpen !== null} onOpenChange={(o) => !o && setManageOpen(null)}>
        <DialogContent className="max-w-sm">
          {manageOpen && (
            <>
              <DialogHeader><DialogTitle>Manage {manageOpen.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Scopes granted</p>
                  <ul className="space-y-1">
                    {manageOpen.scopes.map((s) => (
                      <li key={s} className="text-xs px-2 py-1 rounded bg-surface-secondary text-text-secondary inline-block mr-1">{s}</li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => void handleDisconnect(manageOpen)} disabled={saving} className="w-full mt-4 px-3 py-2 text-sm rounded-lg bg-status-error-soft text-status-error hover:bg-status-error-soft font-semibold">Disconnect</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add tool dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add a tool</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {ADDITIONAL_TOOLS.map((name) => (
              <button key={name} onClick={() => void handleAddTool(name)} disabled={saving}
                className="p-3 border border-border-strong rounded-lg text-sm text-text-secondary hover:border-status-warning hover:bg-status-warning-soft">{name}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
