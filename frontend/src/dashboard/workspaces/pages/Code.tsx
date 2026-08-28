import { useEffect, useMemo, useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Bot, Code2, FilePlus2, Github, Play, RefreshCw, Save, Send, Square, SquareTerminal, TestTube2, Trash2, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchWorkspaces, type WorkspaceRef } from '@/lib/api/workspaces';
import { techitApi } from '@/lib/techitApi';
import {
  createVsCodeGrant, deleteCodeFile, getCodeSnapshot, getProjectAdapter, moveCodeFile,
  planCodeTask, prepareCodeDeployment, proposeCodeChanges, recordRuntime, saveCodeFile,
  saveCodeSyncState, type CodeSnapshot, type ProjectAdapter,
} from '../lib/api/codeWorkspace';
import { approveAndPushToDestination, getRemoteRepositoryState, isCodeSyncPathSafe, pullRemoteFiles, pushToDestination } from '../lib/api/codeSync';
import { listQueuedChanges, queueChange, removeQueuedChange } from '../lib/offline/codeJournal';
import { restartWebContainer, runWebCommand, stopWebCommand } from '../lib/runtime/webContainer';
import { setActiveWorkspaceId } from '../lib/api/client';

type OpenFile = CodeSnapshot['files'][number] & { savedContent: string };
type Mode = 'manual' | 'assist' | 'agent' | 'autonomous';
type BottomPanel = 'terminal' | 'problems' | 'changes' | 'ai' | 'preview';
type Conflict = { path: string; local: string; remote: string };

const DEFAULT_FILE: OpenFile = {
  path: 'README.md', content: '# TechIT project\n', savedContent: '', version: 0,
  contentHash: '', language: 'markdown',
};

function editorLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  return ({ ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', json: 'json', css: 'css', html: 'html', md: 'markdown', py: 'python' } as Record<string, string>)[ext || ''] || 'plaintext';
}

export function Code() {
  const [params, setParams] = useSearchParams();
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [snapshot, setSnapshot] = useState<CodeSnapshot | null>(null);
  const [adapter, setAdapter] = useState<ProjectAdapter | null>(null);
  const [files, setFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState('');
  const [mode, setMode] = useState<Mode>('manual');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal');
  const [terminal, setTerminal] = useState('');
  const [task, setTask] = useState('');
  const [plan, setPlan] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [remote, setRemote] = useState({ repo: '', branch: 'main', headSha: '' });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const active = files.find(file => file.path === activePath) || files[0];
  const changed = files.filter(file => file.content !== file.savedContent);
  const problems = terminal.split('\n').filter(line => /\b(error|failed|exception|warning)\b/i.test(line)).slice(-100);

  useEffect(() => {
    void fetchWorkspaces().then(rows => {
      setWorkspaces(rows);
      const selected = rows.find(row => row.projectId === params.get('startup'))
        || rows.find(row => row.id === params.get('workspace')) || rows[0];
      if (selected) setWorkspaceId(selected.id);
    });
  }, []);

  async function reload() {
    if (!workspaceId) return;
    setBusy(true);
    try {
      const [next, detected, queued] = await Promise.all([
        getCodeSnapshot(workspaceId), getProjectAdapter(workspaceId), listQueuedChanges(workspaceId),
      ]);
      setSnapshot(next); setAdapter(detected);
      const loaded = (next.files.length ? next.files : [DEFAULT_FILE]).map(file => ({ ...file, savedContent: file.content }));
      for (const entry of queued) {
        const file = loaded.find(item => item.path === entry.path);
        if (file) file.content = entry.content;
      }
      setFiles(loaded);
      setActivePath(current => loaded.some(file => file.path === current) ? current : loaded[0]?.path || '');
      if (next.sync) setRemote({ repo: next.sync.repo, branch: next.sync.branch, headSha: next.sync.baseHeadSha });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Code Workspace failed to load.');
    } finally { setBusy(false); }
  }

  useEffect(() => { setActiveWorkspaceId(workspaceId || null); void reload(); }, [workspaceId]);
  useEffect(() => {
    const flush = () => { if (navigator.onLine) void saveAll(); };
    window.addEventListener('online', flush); return () => window.removeEventListener('online', flush);
  });

  function updateActive(content = '') {
    if (!active) return;
    setFiles(current => current.map(file => file.path === active.path ? { ...file, content } : file));
    void queueChange({ workspaceId, path: active.path, content, baseVersion: active.version });
  }

  async function saveAll(): Promise<boolean> {
    if (!workspaceId || changed.length === 0) return true;
    if (!navigator.onLine) { toast.info('Changes are stored offline and will synchronize when connectivity returns.'); return false; }
    setBusy(true);
    try {
      const next = [...files];
      for (const file of changed) {
        const saved = await saveCodeFile(workspaceId, { path: file.path, content: file.content, expectedVersion: file.version, source: mode });
        next[next.findIndex(row => row.path === file.path)] = { ...saved, savedContent: saved.content };
        await removeQueuedChange(`${workspaceId}:${file.path}`);
      }
      setFiles(next); toast.success('Project files saved to TechIT.'); return true;
    } catch (error) {
      setBottomPanel('changes');
      toast.error(error instanceof Error ? error.message : 'Version conflict. Review before saving.'); return false;
    } finally { setBusy(false); }
  }

  async function run(kind: 'dev' | 'test' | 'build') {
    const command = adapter?.commands[kind];
    if (!command || !adapter?.supportedInBrowser) return toast.error('This command is not supported by the browser adapter.');
    setBottomPanel('terminal'); setTerminal(`$ ${command}\n`); const started = performance.now();
    try {
      const result = await runWebCommand(files, command, chunk => setTerminal(value => value + chunk), kind === 'dev' ? url => { setPreviewUrl(url); setBottomPanel('preview'); } : undefined);
      await recordRuntime(workspaceId, { adapter: adapter.adapter, commandType: kind, command, status: kind === 'dev' || result.exitCode === 0 ? 'completed' : 'failed', exitCode: result.exitCode, durationMs: Math.round(performance.now() - started) });
    } catch (error) {
      setTerminal(value => `${value}\n${String(error)}`);
      await recordRuntime(workspaceId, { adapter: adapter?.adapter, commandType: kind, command, status: 'crashed', outputSummary: String(error) });
    }
  }

  function createFile() {
    const path = window.prompt('New project-relative file path');
    if (!path || files.some(file => file.path === path)) return;
    if (!isCodeSyncPathSafe(path)) return toast.error('That path is unsafe or may expose sensitive project data.');
    const file: OpenFile = { path, content: '', savedContent: '', version: 0, contentHash: '', language: editorLanguage(path) };
    setFiles(current => [...current, file]); setActivePath(path);
  }

  async function renameActive() {
    if (!active) return; const path = window.prompt('New project-relative path', active.path); if (!path || path === active.path) return;
    if (!isCodeSyncPathSafe(path)) return toast.error('That path is unsafe or may expose sensitive project data.');
    if (active.version > 0) await moveCodeFile(workspaceId, active.path, path, active.version);
    setFiles(current => current.map(file => file.path === active.path ? { ...file, path, language: editorLanguage(path) } : file)); setActivePath(path);
  }

  async function removeActive() {
    if (!active || !window.confirm(`Delete ${active.path}? History will remain auditable.`)) return;
    if (active.version > 0) await deleteCodeFile(workspaceId, active.path, active.version);
    const remaining = files.filter(file => file.path !== active.path); setFiles(remaining); setActivePath(remaining[0]?.path || '');
  }

  async function pull() {
    if (!remote.repo) return toast.error('Configure a connected GitHub repository first.');
    setBusy(true);
    try {
      const projectId = snapshot?.workspace.projectId;
      if (!projectId) throw new Error('The active Workspace is not linked to a project.');
      const state = await getRemoteRepositoryState(projectId, remote.repo, remote.branch);
      const paths = state.files.filter(row => row.size <= 1_000_000 && isCodeSyncPathSafe(row.path)).slice(0, 50).map(row => row.path);
      const pulled = await pullRemoteFiles(projectId, remote.repo, remote.branch, paths);
      const nextConflicts: Conflict[] = [];
      const next = [...files];
      for (const remoteFile of pulled.files) {
        const local = next.find(file => file.path === remoteFile.path);
        if (local && local.content !== remoteFile.content) nextConflicts.push({ path: remoteFile.path, local: local.content, remote: remoteFile.content });
        else if (!local) next.push({ ...remoteFile, version: 0, contentHash: '', language: editorLanguage(remoteFile.path), savedContent: remoteFile.content });
      }
      setFiles(next); setConflicts(nextConflicts); setRemote(value => ({ ...value, headSha: pulled.headSha }));
      await saveCodeSyncState(workspaceId, { provider: 'github', repo: remote.repo, branch: remote.branch, baseHeadSha: pulled.headSha, snapshotHash: snapshot?.snapshotHash });
      setBottomPanel(nextConflicts.length ? 'changes' : 'terminal');
      toast[nextConflicts.length ? 'warning' : 'success'](nextConflicts.length ? `${nextConflicts.length} conflict(s) require review.` : 'Remote files pulled.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Pull failed.'); }
    finally { setBusy(false); }
  }

  function resolveConflict(conflict: Conflict, choice: 'local' | 'remote' | 'merge') {
    if (choice === 'remote') setFiles(current => current.map(file => file.path === conflict.path ? { ...file, content: conflict.remote, savedContent: conflict.remote } : file));
    if (choice === 'merge') { setActivePath(conflict.path); setBottomPanel('changes'); return; }
    setConflicts(current => current.filter(item => item.path !== conflict.path));
  }

  async function push() {
    if (!remote.repo || !remote.headSha || changed.length === 0) return toast.error('A remote base and reviewed changes are required.');
    if (conflicts.length) return toast.error('Resolve all pull conflicts before pushing.');
    const pendingChanges = changed.map(file => ({ path: file.path, content: file.content }));
    if (!await saveAll()) return;
    const input = { projectId: snapshot?.workspace.projectId || '', repo: remote.repo, branch: remote.branch, expectedHeadSha: remote.headSha, message: window.prompt('Commit message') || 'Update from TechIT Workspace', files: pendingChanges };
    const result = await pushToDestination(input);
    if (!result.ok && result.error.code === 'pending_approval' && result.approvalRequestId && window.confirm('Approve this repository push?')) {
      const executed = await approveAndPushToDestination(input, result.approvalRequestId);
      if (executed.ok) { const data = executed.data as { commitSha: string }; setRemote(value => ({ ...value, headSha: data.commitSha })); toast.success('Committed and pushed. Team and investor evidence recorded.'); }
      else toast.error(executed.error.detail || executed.error.error);
    } else if (!result.ok) toast.error(result.error.detail || result.error.error);
  }

  async function askAI(applyProposal: boolean) {
    if (!task.trim() || !snapshot) return;
    setBusy(true); setBottomPanel('ai');
    try {
      if (!applyProposal) {
        const response = await planCodeTask({ workspace_id: workspaceId, project_id: snapshot.workspace.projectId, requirement: task, active_file: active?.path, files: files.map(file => ({ path: file.path, language: file.language })), diff: changed.map(file => ({ path: file.path })), adapter });
        setPlan(JSON.stringify(response.plan, null, 2)); return;
      }
      const response = await proposeCodeChanges({ workspace_id: workspaceId, project_id: snapshot.workspace.projectId, requirement: task, files: files.slice(0, 80).map(file => ({ path: file.path, language: file.language, content: file.content })) });
      setPlan(JSON.stringify(response.proposal, null, 2));
      const approved = mode === 'autonomous' || window.confirm(`Apply ${response.proposal.changes.length} proposed change(s) to editor buffers for review?`);
      if (approved) {
        setFiles(current => current.map(file => { const proposal = response.proposal.changes.find(item => item.path === file.path); return proposal ? { ...file, content: proposal.content } : file; }));
        for (const proposal of response.proposal.changes) { const file = files.find(item => item.path === proposal.path); await queueChange({ workspaceId, path: proposal.path, content: proposal.content, baseVersion: file?.version }); }
        setBottomPanel('changes');
      }
    } catch { setPlan('TechIT AI is unavailable. No project files were changed.'); }
    finally { setBusy(false); }
  }

  async function deployPreview() {
    if (!snapshot || !remote.repo || !remote.headSha) return toast.error('A pushed commit and repository are required.');
    const workflow = window.prompt('Existing GitHub deployment workflow file', 'deploy.yml'); if (!workflow) return;
    const workflowInput = { projectId: snapshot.workspace.projectId, repo: remote.repo, workflow, ref: remote.branch };
    const pending = await techitApi.invoke('github', 'run_workflow', workflowInput);
    if (!pending.ok && pending.error.code === 'pending_approval' && pending.approvalRequestId && window.confirm('Approve preview deployment workflow?')) {
      await techitApi.approve(pending.approvalRequestId);
      const run = await techitApi.invoke('github', 'run_workflow', { ...workflowInput, approvalRequestId: pending.approvalRequestId });
      if (run.ok) { await prepareCodeDeployment(workspaceId, { confirm: true, environment: 'preview', destination: `github:${workflow}`, commitSha: remote.headSha, buildStatus: problems.length ? 'warning' : 'passed', testStatus: terminal.includes('failed') ? 'failed' : 'recorded', securityStatus: 'pending_review' }); toast.success('Preview deployment dispatched and recorded.'); }
    }
  }

  async function openVSCode() {
    const grant = await createVsCodeGrant(workspaceId, {});
    window.location.href = `vscode://techit.network/open?workspace=${encodeURIComponent(workspaceId)}&grant=${encodeURIComponent(grant.token)}`;
    setTimeout(() => toast.info('VS Code bridge not detected. Continue in TechIT Code Editor.'), 1200);
  }

  const conflict = conflicts[0];
  return (
    <div className="flex h-full min-h-[calc(100vh-60px)] flex-col bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <Code2 className="h-5 w-5 text-cyan-400" />
        <select value={workspaceId} onChange={event => { setWorkspaceId(event.target.value); setParams({ workspace: event.target.value }); }} className="h-9 rounded border border-slate-700 bg-slate-950 px-2 text-sm">{workspaces.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
        <div className="flex rounded border border-slate-700 bg-slate-950 p-0.5">{(['manual','assist','agent','autonomous'] as Mode[]).map(value => <button key={value} onClick={() => setMode(value)} className={`px-2 py-1 text-xs capitalize ${mode === value ? 'bg-cyan-700 text-white' : 'text-slate-400'}`}>{value}</button>)}</div>
        <span className="text-xs text-slate-400">{adapter?.adapter || 'detecting'} · {changed.length} changed · {navigator.onLine ? 'online' : 'offline'}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={createFile} className="icon-button" title="New file"><FilePlus2 className="h-4 w-4" /></button>
          <button onClick={() => void renameActive()} className="toolbar-button">Rename</button>
          <button onClick={() => void removeActive()} className="icon-button" title="Delete"><Trash2 className="h-4 w-4" /></button>
          <button onClick={() => void saveAll()} disabled={busy || !changed.length} className="icon-button" title="Save"><Save className="h-4 w-4" /></button>
          <button onClick={() => void run('dev')} className="toolbar-button"><Play className="h-4 w-4" />Run</button>
          <button onClick={() => { stopWebCommand(); setTerminal(value => `${value}\nProcess stopped by user.`); }} className="icon-button" title="Stop runtime"><Square className="h-4 w-4" /></button>
          <button onClick={() => void run('test')} className="toolbar-button"><TestTube2 className="h-4 w-4" />Test</button>
          <button onClick={() => void run('build')} className="toolbar-button">Build</button>
          <button onClick={() => { const repo = window.prompt('Connected GitHub repository (owner/repo)', remote.repo); if (repo) setRemote(value => ({ ...value, repo })); }} className="icon-button" title="Configure GitHub"><Github className="h-4 w-4" /></button>
          <button onClick={() => void pull()} className="toolbar-button"><RefreshCw className="h-4 w-4" />Pull</button>
          <button onClick={() => void push()} className="toolbar-button"><UploadCloud className="h-4 w-4" />Push</button>
          <button onClick={() => void deployPreview()} className="toolbar-button">Deploy</button>
          <button onClick={() => void openVSCode()} className="toolbar-button">VS Code</button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_300px] max-lg:grid-cols-[180px_minmax(0,1fr)] max-md:block">
        <aside className="overflow-auto border-r border-slate-800 bg-slate-900 p-2 max-md:flex max-md:max-h-28 max-md:border-b"><div className="mb-2 px-2 text-xs font-semibold uppercase text-slate-500">Files</div>{files.map(file => <button key={file.path} onClick={() => setActivePath(file.path)} className={`block w-full truncate rounded px-2 py-1.5 text-left text-xs ${active?.path === file.path ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'}`}>{file.content !== file.savedContent ? '● ' : ''}{file.path}</button>)}</aside>
        <main className="min-h-0 bg-[#1e1e1e]">{active ? <Editor height="100%" path={active.path} language={active.language} value={active.content} onChange={updateActive} theme="vs-dark" options={{ minimap: { enabled: true }, fontSize: 13, automaticLayout: true, wordWrap: 'on', tabSize: 2, formatOnPaste: true }} /> : <div className="p-8 text-slate-400">Create or pull a file to begin.</div>}</main>
        <aside className="border-l border-slate-800 bg-slate-900 p-3 max-lg:hidden"><div className="mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-violet-400" /><span className="font-medium">TechIT Coding Intelligence</span></div><textarea value={task} onChange={event => setTask(event.target.value)} rows={5} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Describe what should be built and why..." /><button onClick={() => void askAI(false)} className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-violet-600 px-3 py-2 text-sm"><Send className="h-4 w-4" />Prepare build plan</button>{mode !== 'manual' && <button onClick={() => void askAI(true)} className="mt-2 w-full rounded border border-violet-500 px-3 py-2 text-sm">Generate reviewable changes</button>}<pre className="mt-3 max-h-[48vh] overflow-auto whitespace-pre-wrap text-xs text-slate-300">{plan || 'AI uses existing Workspace context and cannot push or deploy without approval.'}</pre></aside>
      </div>

      <div className="h-[260px] border-t border-slate-800 bg-slate-950">
        <div className="flex h-9 items-center gap-1 border-b border-slate-800 px-2">{(['terminal','problems','changes','ai','preview'] as BottomPanel[]).map(value => <button key={value} onClick={() => setBottomPanel(value)} className={`px-3 py-1 text-xs capitalize ${bottomPanel === value ? 'text-cyan-300' : 'text-slate-500'}`}>{value}{value === 'problems' && problems.length ? ` (${problems.length})` : ''}</button>)}<button onClick={() => void restartWebContainer()} className="ml-auto icon-button" title="Restart runtime"><RefreshCw className="h-3 w-3" /></button></div>
        {bottomPanel === 'terminal' && <pre className="h-[220px] overflow-auto p-3 text-xs text-green-300"><SquareTerminal className="mr-2 inline h-4 w-4" />{terminal || 'Runtime initializes only when Run, Test, or Build is selected.'}</pre>}
        {bottomPanel === 'problems' && <pre className="h-[220px] overflow-auto p-3 text-xs text-amber-300">{problems.join('\n') || 'No parsed problems.'}</pre>}
        {bottomPanel === 'changes' && <div className="h-[220px]">{conflict ? <div className="grid h-full grid-cols-[1fr_190px]"><DiffEditor height="100%" original={conflict.remote} modified={conflict.local} language={editorLanguage(conflict.path)} theme="vs-dark" /><div className="space-y-2 border-l border-slate-800 p-3 text-xs"><p className="font-medium">Conflict: {conflict.path}</p><button onClick={() => resolveConflict(conflict, 'local')} className="toolbar-button w-full">Keep Local</button><button onClick={() => resolveConflict(conflict, 'remote')} className="toolbar-button w-full">Keep Remote</button><button onClick={() => resolveConflict(conflict, 'merge')} className="toolbar-button w-full">Edit Merge</button><button onClick={() => setConflicts([])} className="toolbar-button w-full">Cancel Pull</button></div></div> : changed[0] ? <DiffEditor height="100%" original={changed[0].savedContent} modified={changed[0].content} language={changed[0].language} theme="vs-dark" /> : <div className="p-4 text-sm text-slate-500">No changes.</div>}</div>}
        {bottomPanel === 'ai' && <pre className="h-[220px] overflow-auto p-3 text-xs">{plan}</pre>}
        {bottomPanel === 'preview' && (previewUrl ? <iframe title="Live preview" src={previewUrl} className="h-full w-full bg-white" sandbox="allow-scripts allow-forms allow-modals allow-same-origin" /> : <div className="p-4 text-sm text-slate-500">Start a supported development server to open preview.</div>)}
      </div>
      <style>{`.icon-button{display:inline-flex;height:36px;width:36px;align-items:center;justify-content:center;border-radius:6px;border:1px solid #334155;background:#0f172a}.toolbar-button{display:inline-flex;height:36px;align-items:center;justify-content:center;gap:6px;border-radius:6px;border:1px solid #334155;background:#0f172a;padding:0 10px;font-size:12px}.icon-button:disabled,.toolbar-button:disabled{opacity:.4}`}</style>
    </div>
  );
}
