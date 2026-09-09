import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Code2, Plus, Wrench, Shield, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Tools</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Your connected developer integrations and dev environment across projects.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          disabled={loading || workspaces.length === 0}
          className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Tool</span>
        </button>
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Live tools are unavailable.</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={() => void loadTools()}
            className="mt-3 text-xs px-3.5 py-1.5 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* Code Editor Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0066ff]/10 via-cyan-500/5 to-[#58a6ff]/10 dark:from-[#0066ff]/15 dark:via-cyan-500/10 dark:to-[#58a6ff]/15 border border-[#0066ff]/20 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066ff] to-cyan-500 text-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,102,255,0.3)] shrink-0">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Integrated Web IDE & Terminal</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-xl">
              Write, execute, test, and ship code directly inside your project's live sandboxed TechIT Workspace.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/workspaces/code${workspaces[0]?.id ? `?workspace=${encodeURIComponent(workspaces[0].id)}` : ''}`)}
          disabled={!workspaces.length}
          className="h-10 rounded-xl bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 px-5 text-xs font-bold text-white transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
        >
          <span>Open Code Editor</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading && <p className="text-xs text-slate-500 dark:text-slate-400 md:col-span-3 text-center py-6">Loading live tools...</p>}
        {!loading && !error && toolList.length === 0 && (
          <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-8 text-center text-xs text-slate-500 dark:text-slate-400 md:col-span-3 bg-white/40 dark:bg-[#121212]/40">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
            No live tools are connected to your workspaces yet.
          </div>
        )}
        {toolList.map((t) => (
          <div
            key={`${t.workspaceId}:${t.id}`}
            className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  t.status === "connected"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20"
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last sync: {formatLastSync(t.lastSyncedAt)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">{t.updates} updates tracked</p>
            </div>

            <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/06">
              {t.status === "connected" ? (
                <button
                  onClick={() => setManageOpen(t)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-black/[0.08] dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Manage Scopes
                </button>
              ) : (
                <button
                  onClick={() => setConnectOpen(t)}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  Connect Integration
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connect dialog */}
      <Dialog open={connectOpen !== null} onOpenChange={(o) => !o && setConnectOpen(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          {connectOpen && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Connect {connectOpen.name}</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-slate-600 dark:text-slate-300 py-2">Grant workspace repository and event access for {connectOpen.name}.</p>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <button
                  onClick={() => setConnectOpen(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConnect(connectOpen)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
                >
                  Authorize {connectOpen.name}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage dialog */}
      <Dialog open={manageOpen !== null} onOpenChange={(o) => !o && setManageOpen(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          {manageOpen && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Manage {manageOpen.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <p className="uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-2">Granted Scopes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {manageOpen.scopes.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => void handleDisconnect(manageOpen)}
                  disabled={saving}
                  className="w-full mt-4 px-3 py-2.5 text-xs rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 font-bold transition-colors"
                >
                  Disconnect Tool
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add tool dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Connect Developer Tool</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2.5 py-3">
            {ADDITIONAL_TOOLS.map((name) => (
              <button
                key={name}
                onClick={() => void handleAddTool(name)}
                disabled={saving}
                className="p-3.5 border border-black/[0.08] dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#0066ff] hover:bg-[#0066ff]/5 dark:hover:bg-[#0066ff]/10 transition-colors text-center"
              >
                {name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
