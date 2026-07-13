import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-slate-900">Tools</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your build environment across projects.</p>
        </div>
        <button onClick={() => setAddOpen(true)} disabled={loading || workspaces.length === 0}
          className="h-9 px-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Connect new tool
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700">Live tools are unavailable.</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button onClick={() => void loadTools()}
            className="mt-3 text-xs px-3 py-1.5 border border-red-300 rounded-lg text-red-700 hover:bg-red-100">
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-slate-500 md:col-span-3">Loading live tools...</p>}
        {!loading && !error && toolList.length === 0 && (
          <p className="text-sm text-slate-500 md:col-span-3">No live tools are connected to your workspaces yet.</p>
        )}
        {toolList.map((t) => (
          <div key={`${t.workspaceId}:${t.id}`} className="border border-slate-200 bg-white rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{t.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "connected" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{t.status}</span>
            </div>
            <p className="text-xs text-slate-500">Last sync: {formatLastSync(t.lastSyncedAt)}</p>
            <p className="text-xs text-slate-500 mt-1">{t.updates} updates</p>
            <div className="mt-4">
              {t.status === "connected" ? (
                <button onClick={() => setManageOpen(t)} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50">Manage</button>
              ) : (
                <button onClick={() => setConnectOpen(t)} className="w-full text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Connect</button>
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
              <p className="text-sm text-slate-600">Continue to grant workspace access for {connectOpen.name}.</p>
              <DialogFooter>
                <button onClick={() => setConnectOpen(null)} className="px-4 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-100">Cancel</button>
                <button onClick={() => void handleConnect(connectOpen)} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400">Continue to {connectOpen.name}</button>
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
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Scopes granted</p>
                  <ul className="space-y-1">
                    {manageOpen.scopes.map((s) => (
                      <li key={s} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 inline-block mr-1">{s}</li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => void handleDisconnect(manageOpen)} disabled={saving} className="w-full mt-4 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold">Disconnect</button>
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
                className="p-3 border border-slate-300 rounded-lg text-sm text-slate-700 hover:border-amber-500 hover:bg-amber-50">{name}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
