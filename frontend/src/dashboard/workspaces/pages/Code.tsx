import { useEffect, useMemo, useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Bot, Code2, FilePlus2, Github, Play, RefreshCw, Save, Send, Square, SquareTerminal, TestTube2, Trash2, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchWorkspaces, type WorkspaceRef } from '@/lib/api/workspaces';
import { techitApi } from '@/lib/techitApi';
import { platformApiOrigin } from '@/lib/platformApi';
import {
  applyCodeExecutionRun, createCodeExecutionRun, createVsCodeGrant, deleteCodeFile, finalizeCodeExecutionRun,
  getCodeSnapshot, getProjectAdapter, listCodeDestinations, moveCodeFile, orchestrateCodeTask,
  planCodeTask, prepareCodeDeployment, proposeCodeChanges, recordCodeExecutionStage, recordCodeReview,
  recordRuntime, saveCodeFile, saveCodeSyncState, type CodeDestination, type CodeExecutionRun,
  type CodeHunk, type CodeSnapshot, type ProjectAdapter, verifyCodeDeployment,
} from '../lib/api/codeWorkspace';
import { approveAndPushToDestination, getRemoteRepositoryState, isCodeSyncPathSafe, pullRemoteFiles, pushToDestination, type CodeDestinationProvider } from '../lib/api/codeSync';
import { listQueuedChanges, queueChange, removeQueuedChange } from '../lib/offline/codeJournal';
import { restartWebContainer, runWebCommand, stopWebCommand } from '../lib/runtime/webContainer';
import { setActiveWorkspaceId } from '../lib/api/client';
import { applyAcceptedHunks, buildReviewHunks, sha256, threeWayMerge } from '../lib/codeReview';

type OpenFile = CodeSnapshot['files'][number] & { savedContent: string };
type Mode = 'manual' | 'assist' | 'agent' | 'autonomous';
type BottomPanel = 'terminal' | 'problems' | 'changes' | 'ai' | 'preview';
type Conflict = { path: string; base: string; local: string; remote: string; merged: string; automatic: boolean; remoteDeleted?: boolean };
type ReviewProposal = { path: string; baseline: string; proposed: string; contentHash: string; baseContentHash: string; hunks: CodeHunk[] };

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
  const [destinations, setDestinations] = useState<CodeDestination[]>([]);
  const [destinationId, setDestinationId] = useState('');
  const [remote, setRemote] = useState<{ provider: CodeDestinationProvider; repo: string; branch: string; headSha: string }>({ provider: 'github', repo: '', branch: 'main', headSha: '' });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [executionRun, setExecutionRun] = useState<CodeExecutionRun | null>(null);
  const [reviewProposals, setReviewProposals] = useState<ReviewProposal[]>([]);
  const [reviewPath, setReviewPath] = useState('');
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, Record<string, boolean>>>({});

  const active = files.find(file => file.path === activePath) || files[0];
  const changed = files.filter(file => file.content !== file.savedContent);
  const problems = terminal.split('\n').filter(line => /\b(error|failed|exception|warning)\b/i.test(line)).slice(-100);
  const reviewProposal = reviewProposals.find(row => row.path === reviewPath) || reviewProposals[0];
  const reviewContent = useMemo(() => reviewProposal ? applyAcceptedHunks(reviewProposal.baseline, reviewProposal.hunks, new Set(Object.entries(reviewDecisions[reviewProposal.path] || {}).filter(([, accepted]) => accepted).map(([id]) => id))) : '', [reviewProposal, reviewDecisions]);
  const selectedDestination = destinations.find(row => row.id === destinationId);

  useEffect(() => {
    void fetchWorkspaces().then(rows => {
      setWorkspaces(rows);
      const selected = rows.find(row => row.projectId === params.get('startup'))
        || rows.find(row => row.id === params.get('workspace')) || rows[0];
      if (selected) setWorkspaceId(selected.id);
    });
  }, [params]);

  async function reload() {
    if (!workspaceId) return;
    setBusy(true);
    try {
      const [next, detected, queued, availableDestinations] = await Promise.all([
        getCodeSnapshot(workspaceId), getProjectAdapter(workspaceId), listQueuedChanges(workspaceId), listCodeDestinations(workspaceId),
      ]);
      setSnapshot(next); setAdapter(detected); setDestinations(availableDestinations);
      const loaded = (next.files.length ? next.files : [DEFAULT_FILE]).map(file => ({ ...file, savedContent: file.content }));
      for (const entry of queued) {
        const operation = entry.operation || 'upsert';
        const file = loaded.find(item => item.path === entry.path);
        if (operation === 'upsert') {
          if (file) file.content = entry.content || '';
          else loaded.push({ path: entry.path, content: entry.content || '', savedContent: '', version: 0, contentHash: '', language: editorLanguage(entry.path) });
        }
        if (operation === 'delete' && file) loaded.splice(loaded.indexOf(file), 1);
        if (operation === 'move' && file && entry.nextPath) { file.path = entry.nextPath; file.language = editorLanguage(entry.nextPath); }
      }
      setFiles(loaded);
      setActivePath(current => loaded.some(file => file.path === current) ? current : loaded[0]?.path || '');
      const selected = availableDestinations.find(row => row.id === destinationId) || availableDestinations.find(row => row.provider === next.sync?.provider && row.repository === next.sync?.repo) || availableDestinations.find(row => row.provider !== 'local');
      if (selected?.repository && selected.provider !== 'local') {
        setDestinationId(selected.id);
        setRemote({ provider: selected.provider, repo: selected.repository, branch: next.sync?.branch || 'main', headSha: next.sync?.baseHeadSha || '' });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Code Workspace failed to load.');
    } finally { setBusy(false); }
  }

  // reload is intentionally scoped to the selected Workspace; destination selection is restored inside it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveWorkspaceId(workspaceId || null); void reload(); }, [workspaceId]);
  useEffect(() => {
    const flush = () => { if (navigator.onLine) void saveAll(); };
    window.addEventListener('online', flush); return () => window.removeEventListener('online', flush);
  // The online handler must see the latest editor buffers without running synchronization on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, files]);

  function updateActive(content = '') {
    if (!active) return;
    setFiles(current => current.map(file => file.path === active.path ? { ...file, content } : file));
    void queueChange({ workspaceId, path: active.path, operation: 'upsert', content, baseVersion: active.version });
  }

  async function saveAll(): Promise<boolean> {
    if (!workspaceId) return true;
    if (!navigator.onLine) { toast.info('Changes are stored offline and will synchronize when connectivity returns.'); return false; }
    const queued = await listQueuedChanges(workspaceId);
    if (changed.length === 0 && queued.length === 0) return true;
    setBusy(true);
    try {
      const next = [...files];
      for (const entry of queued.filter(row => row.operation === 'move' && row.nextPath)) {
        const moved = await moveCodeFile(workspaceId, entry.path, entry.nextPath!, Number(entry.baseVersion || 0));
        const local = next.find(row => row.path === entry.nextPath);
        if (local) Object.assign(local, moved, { content: local.content, savedContent: local.savedContent });
        await removeQueuedChange(entry.id);
      }
      for (const entry of queued.filter(row => row.operation === 'delete')) {
        if (Number(entry.baseVersion || 0) > 0) await deleteCodeFile(workspaceId, entry.path, Number(entry.baseVersion));
        await removeQueuedChange(entry.id);
      }
      for (const file of next.filter(row => row.content !== row.savedContent)) {
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

  function runtimeProject(proposals: ReviewProposal[]) {
    const runtimeFiles = [...files.map(file => ({ ...file, content: proposals.find(row => row.path === file.path)?.proposed || file.content }))];
    for (const proposal of proposals) if (!runtimeFiles.some(file => file.path === proposal.path)) runtimeFiles.push({ path: proposal.path, content: proposal.proposed, savedContent: '', version: 0, contentHash: '', language: editorLanguage(proposal.path) });
    return runtimeFiles;
  }

  async function debugFailedProposal(runRecord: CodeExecutionRun, failureOutput: string) {
    const response = await proposeCodeChanges({ workspace_id: workspaceId, project_id: snapshot?.workspace.projectId, requirement: `${task}\n\nDebugger evidence:\n${failureOutput.slice(-8000)}`, files: runtimeProject(reviewProposals).slice(0, 80).map(file => ({ path: file.path, language: file.language, content: file.content })) });
    const proposals: ReviewProposal[] = [];
    for (const proposal of response.proposal.changes) {
      const baseline = files.find(file => file.path === proposal.path)?.content || '';
      if (proposal.content === baseline) continue;
      proposals.push({ path: proposal.path, baseline, proposed: proposal.content, contentHash: await sha256(proposal.content), baseContentHash: await sha256(baseline), hunks: await buildReviewHunks(proposal.path, baseline, proposal.content) });
    }
    let next = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'debugger', status: 'completed', agent: 'DebuggerAgent', summary: 'Analyzed WebContainer test evidence and prepared a bounded repair.', evidence: { failureOutput: failureOutput.slice(-4000) } });
    next = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'code', status: 'completed', agent: 'CodeAgent', changes: proposals.map(row => ({ path: row.path, contentHash: row.contentHash, baseContentHash: row.baseContentHash, hunks: row.hunks, reason: 'Debugger-guided repair' })) });
    setReviewProposals(proposals); setReviewPath(proposals[0]?.path || ''); setReviewDecisions({}); setExecutionRun(next);
    return { run: next, proposals };
  }

  async function run(kind: 'dev' | 'test' | 'build') {
    const command = adapter?.commands[kind];
    if (!command || !adapter?.supportedInBrowser) return toast.error('This command is not supported by the browser adapter.');
    setBottomPanel('terminal'); setTerminal(`$ ${command}\n`);
    try {
      const execute = async (proposals: ReviewProposal[], runRecord: CodeExecutionRun | null) => {
        const started = performance.now(); let output = '';
        const result = await runWebCommand(runtimeProject(proposals), command, chunk => { output += chunk; setTerminal(value => value + chunk); }, kind === 'dev' ? url => { setPreviewUrl(url); setBottomPanel('preview'); } : undefined);
        const session = await recordRuntime(workspaceId, { executionRunId: runRecord?.id, adapter: adapter.adapter, commandType: kind, command, status: kind === 'dev' || result.exitCode === 0 ? 'completed' : 'failed', exitCode: result.exitCode, durationMs: Math.round(performance.now() - started), outputSummary: output.slice(-3000) });
        return { result, session, output };
      };
      let runRecord = executionRun; let proposals = reviewProposals;
      let attempt = await execute(proposals, runRecord);
      const verifiesCode = kind === 'test' || (kind === 'build' && !adapter.commands.test);
      if (runRecord && verifiesCode && attempt.result.exitCode !== 0) {
        runRecord = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'test', status: 'failed', agent: 'TestAgent', summary: attempt.output.slice(-4000) || `${kind} exited with ${attempt.result.exitCode}.` });
        if (mode === 'autonomous') {
          setTerminal(value => `${value}\nDebuggerAgent is preparing one bounded repair attempt.\n`);
          const repaired = await debugFailedProposal(runRecord, attempt.output); runRecord = repaired.run; proposals = repaired.proposals;
          setTerminal(value => `${value}\n$ ${command} # retry\n`);
          attempt = await execute(proposals, runRecord);
        }
        else setExecutionRun(runRecord);
      }
      if (runRecord && verifiesCode && attempt.result.exitCode === 0) {
        let next = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'test', status: 'completed', agent: 'TestAgent', runtimeSessionId: attempt.session.id, summary: `${kind} completed in WebContainer.` });
        if (!next.steps.some(row => row.stage === 'debugger' && row.status === 'completed')) next = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'debugger', status: 'skipped', agent: 'DebuggerAgent', summary: 'No debugger cycle was required.' });
        next = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'security', status: 'completed', agent: 'SecurityAgent', changes: proposals.map(row => ({ path: row.path, content: row.proposed })), summary: 'Backend deterministic security rules passed.' });
        setExecutionRun(next);
      } else if (runRecord && verifiesCode && attempt.result.exitCode !== 0 && mode === 'autonomous') {
        setExecutionRun(await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'test', status: 'failed', agent: 'TestAgent', summary: 'The bounded debugger retry did not pass.' }));
      }
    } catch (error) {
      setTerminal(value => `${value}\n${String(error)}`);
      await recordRuntime(workspaceId, { executionRunId: executionRun?.id, adapter: adapter?.adapter, commandType: kind, command, status: 'crashed', outputSummary: String(error) });
      if (executionRun && kind === 'test') setExecutionRun(await recordCodeExecutionStage(workspaceId, executionRun.id, { stage: 'test', status: 'failed', agent: 'TestAgent', summary: String(error) }));
    }
  }

  async function restartRuntime() {
    setTerminal(value => `${value}\nRestarting execution environment...`);
    try { await restartWebContainer(); setTerminal(value => `${value}\nExecution environment ready.`); }
    catch (error) { setTerminal(value => `${value}\n${error instanceof Error ? error.message : 'Execution environment restart failed.'}`); }
  }

  function createFile() {
    const path = window.prompt('New project-relative file path');
    if (!path || files.some(file => file.path === path)) return;
    if (!isCodeSyncPathSafe(path)) return toast.error('That path is unsafe or may expose sensitive project data.');
    const file: OpenFile = { path, content: '', savedContent: '', version: 0, contentHash: '', language: editorLanguage(path) };
    setFiles(current => [...current, file]); setActivePath(path);
    void queueChange({ workspaceId, path, operation: 'upsert', content: '', baseVersion: 0 });
  }

  async function renameActive() {
    if (!active) return; const path = window.prompt('New project-relative path', active.path); if (!path || path === active.path) return;
    if (!isCodeSyncPathSafe(path)) return toast.error('That path is unsafe or may expose sensitive project data.');
    if (active.version > 0 && navigator.onLine) await moveCodeFile(workspaceId, active.path, path, active.version);
    else await queueChange({ workspaceId, path: active.path, operation: 'move', nextPath: path, baseVersion: active.version });
    setFiles(current => current.map(file => file.path === active.path ? { ...file, path, language: editorLanguage(path) } : file)); setActivePath(path);
  }

  async function removeActive() {
    if (!active || !window.confirm(`Delete ${active.path}? History will remain auditable.`)) return;
    if (active.version > 0 && navigator.onLine) await deleteCodeFile(workspaceId, active.path, active.version);
    else await queueChange({ workspaceId, path: active.path, operation: 'delete', baseVersion: active.version });
    const remaining = files.filter(file => file.path !== active.path); setFiles(remaining); setActivePath(remaining[0]?.path || '');
  }

  async function pull() {
    if (!remote.repo) return toast.error('Select a connected repository first.');
    setBusy(true);
    try {
      const projectId = snapshot?.workspace.projectId;
      if (!projectId) throw new Error('The active Workspace is not linked to a project.');
      const state = await getRemoteRepositoryState(projectId, remote.repo, remote.branch, remote.provider);
      const paths = state.files.filter(row => row.size <= 1_000_000 && isCodeSyncPathSafe(row.path)).slice(0, 50).map(row => row.path);
      const pulled = await pullRemoteFiles(projectId, remote.repo, remote.branch, paths, remote.provider);
      const nextConflicts: Conflict[] = [];
      const next = [...files];
      const remotePaths = new Set(pulled.files.map(file => file.path));
      for (const remoteFile of pulled.files) {
        const local = next.find(file => file.path === remoteFile.path);
        const base = snapshot?.sync?.baseFiles?.find(file => file.path === remoteFile.path)?.content ?? local?.savedContent ?? '';
        if (local && local.content !== remoteFile.content) {
          if (local.content === base) {
            const saved = await saveCodeFile(workspaceId, { path: remoteFile.path, content: remoteFile.content, expectedVersion: local.version, source: `${remote.provider}_pull` });
            Object.assign(local, saved, { savedContent: saved.content });
          } else {
            const merged = threeWayMerge(base, local.content, remoteFile.content);
            if (merged.conflict) nextConflicts.push({ path: remoteFile.path, base, local: local.content, remote: remoteFile.content, merged: merged.content, automatic: false });
            else { Object.assign(local, { content: merged.content }); await queueChange({ workspaceId, path: local.path, operation: 'upsert', content: merged.content, baseVersion: local.version }); }
          }
        }
        else if (!local) {
          const saved = await saveCodeFile(workspaceId, { path: remoteFile.path, content: remoteFile.content, expectedVersion: 0, source: `${remote.provider}_pull` });
          next.push({ ...saved, savedContent: saved.content });
        }
      }
      for (const baseFile of snapshot?.sync?.baseFiles || []) {
        if (remotePaths.has(baseFile.path)) continue;
        const local = next.find(file => file.path === baseFile.path); if (!local) continue;
        if (local.content === (baseFile.content ?? local.savedContent)) {
          await deleteCodeFile(workspaceId, local.path, local.version); next.splice(next.indexOf(local), 1);
        } else {
          const merged = threeWayMerge(baseFile.content || '', local.content, '');
          nextConflicts.push({ path: local.path, base: baseFile.content || '', local: local.content, remote: '', merged: merged.content, automatic: false, remoteDeleted: true });
        }
      }
      setFiles(next); setConflicts(nextConflicts); setRemote(value => ({ ...value, headSha: pulled.headSha }));
      const baseFiles = await Promise.all(pulled.files.map(async file => ({ path: file.path, content: file.content, contentHash: await sha256(file.content) })));
      await saveCodeSyncState(workspaceId, { provider: remote.provider, repo: remote.repo, branch: remote.branch, baseHeadSha: pulled.headSha, snapshotHash: snapshot?.snapshotHash, baseFiles });
      setBottomPanel(nextConflicts.length ? 'changes' : 'terminal');
      toast[nextConflicts.length ? 'warning' : 'success'](nextConflicts.length ? `${nextConflicts.length} conflict(s) require review.` : 'Remote files pulled.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Pull failed.'); }
    finally { setBusy(false); }
  }

  async function resolveConflict(conflict: Conflict, choice: 'local' | 'remote' | 'merge') {
    if (choice === 'remote' && conflict.remoteDeleted) {
      const file = files.find(row => row.path === conflict.path);
      if (file?.version && navigator.onLine) await deleteCodeFile(workspaceId, file.path, file.version); else if (file) await queueChange({ workspaceId, path: file.path, operation: 'delete', baseVersion: file.version });
      setFiles(current => current.filter(file => file.path !== conflict.path));
    } else if (choice === 'remote') setFiles(current => current.map(file => file.path === conflict.path ? { ...file, content: conflict.remote } : file));
    if (choice === 'merge') setFiles(current => current.map(file => file.path === conflict.path ? { ...file, content: conflict.merged } : file));
    setConflicts(current => current.filter(item => item.path !== conflict.path));
  }

  async function push() {
    if (!remote.repo || !remote.headSha || changed.length === 0) return toast.error('A remote base and reviewed changes are required.');
    if (conflicts.length) return toast.error('Resolve all pull conflicts before pushing.');
    const pendingChanges = changed.map(file => ({ path: file.path, content: file.content }));
    if (!await saveAll()) return;
    const input = { projectId: snapshot?.workspace.projectId || '', repo: remote.repo, branch: remote.branch, expectedHeadSha: remote.headSha, message: window.prompt('Commit message') || 'Update from TechIT Workspace', files: pendingChanges };
    const result = await pushToDestination(input, remote.provider);
    if (!result.ok && result.error.code === 'pending_approval' && result.approvalRequestId && window.confirm('Approve this repository push?')) {
      const executed = await approveAndPushToDestination(input, result.approvalRequestId, remote.provider);
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
      if (changed.length && !await saveAll()) throw new Error('Save or resolve current edits before starting an agent run.');
      let runRecord: CodeExecutionRun | null = null;
      let proposalFiles = files.slice(0, 80).map(file => ({ path: file.path, language: file.language, content: file.content }));
      if (mode === 'agent' || mode === 'autonomous') {
        const scopedPlan = await planCodeTask({ workspace_id: workspaceId, project_id: snapshot.workspace.projectId, requirement: task, active_file: active?.path, files: files.map(file => ({ path: file.path, language: file.language })), adapter });
        const plannedNewPaths = scopedPlan.plan.changes.filter(change => change.action === 'create' && isCodeSyncPathSafe(change.path) && !files.some(file => file.path === change.path)).slice(0, 20).map(change => change.path);
        proposalFiles = [...proposalFiles, ...plannedNewPaths.map(path => ({ path, language: editorLanguage(path), content: '' }))];
        const allowedPaths = proposalFiles.map(file => file.path);
        runRecord = await createCodeExecutionRun(workspaceId, { requirement: task, mode, adapter: adapter?.adapter, allowedPaths, allowedCommands: Object.values(adapter?.commands || {}).filter(Boolean) });
        const orchestration = await orchestrateCodeTask({ workspace_id: workspaceId, project_id: snapshot.workspace.projectId, requirement: task, allowed_paths: allowedPaths, allowed_commands: Object.values(adapter?.commands || {}).filter(Boolean), files: proposalFiles.map(file => ({ path: file.path, language: file.language })), adapter });
        for (const stageName of ['execution_intelligence', 'mvp_builder', 'product_architect'] as const) {
          const stage = orchestration.orchestration.stages.find(row => row.stage === stageName);
          runRecord = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: stageName, status: 'completed', agent: stage?.agent || stageName, summary: stage?.summary || '', evidence: { actions: stage?.actions || [], risks: stage?.risks || [] } });
        }
        setPlan(JSON.stringify(orchestration.orchestration, null, 2));
      }
      const response = await proposeCodeChanges({ workspace_id: workspaceId, project_id: snapshot.workspace.projectId, requirement: task, files: proposalFiles });
      if (!runRecord) setPlan(JSON.stringify(response.proposal, null, 2));
      if (runRecord) {
        const proposals: ReviewProposal[] = [];
        for (const proposal of response.proposal.changes) {
          const file = files.find(item => item.path === proposal.path); const baseline = file?.content || ''; if (proposal.content === baseline) continue;
          proposals.push({ path: proposal.path, baseline, proposed: proposal.content, contentHash: await sha256(proposal.content), baseContentHash: await sha256(baseline), hunks: await buildReviewHunks(proposal.path, baseline, proposal.content) });
        }
        runRecord = await recordCodeExecutionStage(workspaceId, runRecord.id, { stage: 'code', status: 'completed', agent: 'CodeAgent', changes: proposals.map(row => ({ path: row.path, contentHash: row.contentHash, baseContentHash: row.baseContentHash, hunks: row.hunks, reason: response.proposal.changes.find(change => change.path === row.path)?.reason })) });
        setExecutionRun(runRecord); setReviewProposals(proposals); setReviewPath(proposals[0]?.path || ''); setReviewDecisions({}); setBottomPanel('changes');
        toast.success('Agent proposals are ready for hunk review. Run tests before applying.');
      } else if (window.confirm(`Apply ${response.proposal.changes.length} proposed change(s) to editor buffers for review?`)) {
        setFiles(current => current.map(file => { const proposal = response.proposal.changes.find(item => item.path === file.path); return proposal ? { ...file, content: proposal.content } : file; }));
        for (const proposal of response.proposal.changes) { const file = files.find(item => item.path === proposal.path); await queueChange({ workspaceId, path: proposal.path, operation: 'upsert', content: proposal.content, baseVersion: file?.version }); }
        setBottomPanel('changes');
      }
    } catch (error) { setPlan(error instanceof Error ? error.message : 'TechIT AI is unavailable. No project files were changed.'); }
    finally { setBusy(false); }
  }

  async function completeExecutionReview() {
    if (!executionRun || !reviewProposals.length) return;
    try {
      for (const proposal of reviewProposals) {
        const decisions = reviewDecisions[proposal.path] || {};
        if (proposal.hunks.some(hunk => decisions[hunk.id] === undefined)) throw new Error(`Review every hunk in ${proposal.path}.`);
        await recordCodeReview(workspaceId, executionRun.id, { path: proposal.path, contentHash: proposal.contentHash, decision: 'accepted', hunks: proposal.hunks.map(hunk => ({ id: hunk.id, decision: decisions[hunk.id] ? 'accepted' : 'rejected' })) });
      }
      let next = await recordCodeExecutionStage(workspaceId, executionRun.id, { stage: 'review', status: 'completed', agent: 'CodeReviewAgent', summary: 'Every proposed hunk received an explicit human decision.' });
      next = await finalizeCodeExecutionRun(workspaceId, executionRun.id);
      const applied = reviewProposals.map(proposal => {
        const accepted = new Set(Object.entries(reviewDecisions[proposal.path] || {}).filter(([, value]) => value).map(([id]) => id));
        const file = files.find(row => row.path === proposal.path);
        return { path: proposal.path, content: applyAcceptedHunks(proposal.baseline, proposal.hunks, accepted), expectedVersion: file?.version || 0 };
      });
      const result = await applyCodeExecutionRun(workspaceId, executionRun.id, applied);
      setExecutionRun(result.run); setReviewProposals([]); setReviewPath(''); setReviewDecisions({}); await reload();
      toast.success('Reviewed changes applied to the authoritative TechIT project.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Review could not be completed.'); }
  }

  async function deployPreview() {
    if (!snapshot || !remote.repo || !remote.headSha) return toast.error('A pushed commit and repository are required.');
    if (!selectedDestination?.capabilities.deploy || remote.provider !== 'github') return toast.error('The selected destination does not expose a deployment adapter.');
    const workflow = window.prompt('Existing GitHub deployment workflow file', 'deploy.yml'); if (!workflow) return;
    const workflowInput = { projectId: snapshot.workspace.projectId, repo: remote.repo, workflow, ref: remote.branch };
    const pending = await techitApi.invoke('github', 'run_workflow', workflowInput);
    if (!pending.ok && pending.error.code === 'pending_approval' && pending.approvalRequestId && window.confirm('Approve preview deployment workflow?')) {
      await techitApi.approve(pending.approvalRequestId);
      const run = await techitApi.invoke('github', 'run_workflow', { ...workflowInput, approvalRequestId: pending.approvalRequestId });
      if (run.ok) {
        const runId = Number((run.data as { runId?: number }).runId || 0);
        const evidence = runId > 0
          ? await techitApi.invoke('github', 'get_workflow_run', { projectId: snapshot.workspace.projectId, repo: remote.repo, runId })
          : await techitApi.invoke('github', 'get_commit_checks', { projectId: snapshot.workspace.projectId, repo: remote.repo, commitSha: remote.headSha });
        const deployment = await prepareCodeDeployment(workspaceId, { confirm: true, environment: 'preview', destination: `github:${workflow}`, commitSha: remote.headSha, buildStatus: problems.length ? 'warning' : 'passed', testStatus: terminal.includes('failed') ? 'failed' : 'recorded', securityStatus: executionRun?.steps.find(row => row.stage === 'security')?.status === 'completed' ? 'passed' : 'pending_review', executionRunId: executionRun?.id });
        if (evidence.ok) {
          const row = evidence.data as { status?: string; providerStatus?: string; checks?: Array<{ name: string; conclusion: string }>; url?: string };
          await verifyCodeDeployment(workspaceId, deployment.id, { providerStatus: row.providerStatus || row.status || 'pending', checks: row.checks || [], url: row.url || '' });
        }
        if (executionRun) setExecutionRun(await recordCodeExecutionStage(workspaceId, executionRun.id, { stage: 'deployment', status: 'completed', agent: 'DeploymentAgent', summary: `Workflow ${workflow} dispatched through the approved MCP adapter.` }));
        toast.success('Preview deployment dispatched and recorded.');
      }
    }
  }

  async function openVSCode() {
    const grant = await createVsCodeGrant(workspaceId, {});
    const command = `npx @techit/code-bridge connect --api ${platformApiOrigin()} --grant ${grant.token} --root .`;
    window.prompt('Run from the project directory, then use techit-code open --workspace ' + workspaceId, command);
  }

  const conflict = conflicts[0];
  return (
    <div className="flex h-full min-h-[calc(100vh-60px)] flex-col bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Glassmorphic IDE Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl px-4 py-2.5 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] rounded-xl border border-[#0066ff]/20">
            <Code2 className="h-4 w-4" />
          </div>
          <select
            value={workspaceId}
            onChange={event => { setWorkspaceId(event.target.value); setParams({ workspace: event.target.value }); }}
            className="h-8 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 px-2.5 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#0066ff] transition-all cursor-pointer"
          >
            {workspaces.map(row => <option key={row.id} value={row.id} className="dark:bg-[#1a1a1a]">{row.name}</option>)}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1">
          {(['manual','assist','agent','autonomous'] as Mode[]).map(value => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`px-2.5 py-1 text-xs font-semibold capitalize rounded-lg transition-all ${
                mode === value
                  ? 'bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Adapter & Connectivity Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/[0.04] dark:border-white/5">
          <span>{adapter?.adapter || 'Detecting'}</span>
          <span>•</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{changed.length} Edits</span>
          <span>•</span>
          <span className={`inline-flex items-center gap-1 font-bold ${navigator.onLine ? 'text-[#20c937]' : 'text-amber-400'}`}>
            <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-[#20c937] animate-pulse' : 'bg-amber-400'}`} />
            {navigator.onLine ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button onClick={createFile} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-all" title="New file">
            <FilePlus2 className="h-3.5 w-3.5 text-[#0066ff]" /> New
          </button>
          <button onClick={() => void renameActive()} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all">
            Rename
          </button>
          <button onClick={() => void removeActive()} className="h-8 px-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-1 transition-all" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => void saveAll()} disabled={busy || !changed.length} className="h-8 px-3 rounded-xl bg-[#20c937] hover:bg-[#20c937]/90 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all" title="Save All">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={() => void run('dev')} className="h-8 px-3 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
            <Play className="h-3.5 w-3.5 fill-current text-white" /> Run
          </button>
          <button onClick={() => { stopWebCommand(); setTerminal(value => `${value}\nProcess stopped by user.`); }} className="h-8 px-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all" title="Stop runtime">
            <Square className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => void run('test')} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all">
            <TestTube2 className="h-3.5 w-3.5 text-[#58a6ff]" /> Test
          </button>
          <button onClick={() => void run('build')} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all">
            Build
          </button>
          
          <select
            value={destinationId}
            onChange={event => { const selected = destinations.find(row => row.id === event.target.value); setDestinationId(event.target.value); if (selected?.repository && selected.provider !== 'local') { const provider = selected.provider; setRemote(value => ({ ...value, provider, repo: selected.repository!, headSha: '' })); } }}
            className="h-8 max-w-40 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
            title="Synchronization destination"
          >
            <option value="">Destination</option>
            {destinations.map(row => <option key={row.id} value={row.id} className="dark:bg-[#1a1a1a]">{row.provider}: {row.repository || 'VS Code'}</option>)}
          </select>

          <button onClick={() => { const repo = window.prompt('Connected repository', remote.repo); if (repo) setRemote(value => ({ ...value, repo })); }} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-all" title="Configure repository">
            <Github className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => void pull()} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all">
            <RefreshCw className="h-3.5 w-3.5 text-[#0066ff]" /> Pull
          </button>
          <button onClick={() => void push()} className="h-8 px-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all">
            <UploadCloud className="h-3.5 w-3.5" /> Push
          </button>
          <button onClick={() => void deployPreview()} className="h-8 px-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all">
            Deploy
          </button>
          <button onClick={() => void openVSCode()} className="h-8 px-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all">
            VS Code
          </button>
        </div>
      </div>

      {/* Main Workspace IDE Grid Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)_320px] max-lg:grid-cols-[200px_minmax(0,1fr)] max-md:block">
        {/* Left File Explorer Panel */}
        <aside className="overflow-y-auto custom-scrollbar border-r border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl p-3 max-md:flex max-md:max-h-28 max-md:border-b">
          <div className="mb-3 px-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Project Files</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">{files.length}</span>
          </div>
          <div className="space-y-1">
            {files.map(file => {
              const isSelected = active?.path === file.path;
              const isUnsaved = file.content !== file.savedContent;
              return (
                <button
                  key={file.path}
                  onClick={() => setActivePath(file.path)}
                  className={`flex items-center justify-between w-full truncate rounded-xl px-3 py-2 text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#0066ff]/15 via-[#0066ff]/10 to-transparent text-[#0066ff] dark:text-[#58a6ff] font-semibold border-l-4 border-[#0066ff]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <span className="truncate flex-1">{file.path}</span>
                  {isUnsaved && (
                    <span className="w-2 h-2 rounded-full bg-[#0066ff] shrink-0 ml-1.5" title="Unsaved changes" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Code Editor Stage */}
        <main className="min-h-0 bg-[#1e1e1e] relative">
          {active ? (
            <Editor
              height="100%"
              path={active.path}
              language={active.language}
              value={active.content}
              onChange={updateActive}
              theme="vs-dark"
              options={{ minimap: { enabled: true }, fontSize: 13, automaticLayout: true, wordWrap: 'on', tabSize: 2, formatOnPaste: true }}
            />
          ) : (
            <div className="p-8 text-slate-400 flex flex-col items-center justify-center h-full">
              <Code2 className="w-12 h-12 text-[#0066ff] mb-3 opacity-50" />
              <p className="text-sm font-medium">Create or pull a file to start editing code.</p>
            </div>
          )}
        </main>

        {/* Right AI Assistant Sidebar */}
        <aside className="border-l border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl p-4 max-lg:hidden flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">AI Coding Agent</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#20c937] bg-[#20c937]/10 px-2 py-0.5 rounded-full border border-[#20c937]/20">
              Active
            </span>
          </div>

          <textarea
            value={task}
            onChange={event => setTask(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#0066ff] placeholder-slate-400 transition-all resize-none mb-3"
            placeholder="Describe what should be built or refactored..."
          />

          <button
            onClick={() => void askAI(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-3 py-2.5 text-xs font-bold text-white shadow-md transition-all mb-2"
          >
            <Send className="h-3.5 w-3.5" />
            Prepare Build Plan
          </button>

          {mode !== 'manual' && (
            <button
              onClick={() => void askAI(true)}
              className="w-full rounded-xl border border-[#0066ff]/40 text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/10 px-3 py-2 text-xs font-semibold transition-all mb-3"
            >
              Generate Reviewable Changes
            </button>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Plan Output & Context
            </div>
            <pre className="flex-1 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-black/40 p-3 rounded-xl border border-black/[0.06] dark:border-white/10 leading-relaxed font-mono">
              {plan || 'AI uses existing Workspace context. All changes require explicit approval.'}
            </pre>
          </div>
        </aside>
      </div>

      {/* Bottom Panel Console & Preview Tabs */}
      <div className="h-[260px] border-t border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl z-10 shrink-0">
        <div className="flex h-10 items-center justify-between border-b border-black/[0.06] dark:border-white/10 px-3">
          <div className="flex items-center gap-1">
            {(['terminal','problems','changes','ai','preview'] as BottomPanel[]).map(value => (
              <button
                key={value}
                onClick={() => setBottomPanel(value)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all ${
                  bottomPanel === value
                    ? 'bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/30 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {value}
                {value === 'problems' && problems.length ? (
                  <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                    {problems.length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <button onClick={() => void restartRuntime()} className="p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all" title="Restart runtime">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-[220px] overflow-hidden">
          {bottomPanel === 'terminal' && (
            <pre className="h-[220px] overflow-y-auto p-4 text-xs font-mono text-emerald-500 dark:text-emerald-400 bg-slate-950 leading-relaxed custom-scrollbar">
              <SquareTerminal className="mr-2 inline h-4 w-4 text-[#0066ff]" />
              {terminal || 'Runtime initializes when Run, Test, or Build is selected.'}
            </pre>
          )}
          {bottomPanel === 'problems' && (
            <pre className="h-[220px] overflow-y-auto p-4 text-xs font-mono text-amber-500 dark:text-amber-400 bg-slate-950 leading-relaxed custom-scrollbar">
              {problems.join('\n') || 'No parsed errors or warnings.'}
            </pre>
          )}
          {bottomPanel === 'changes' && (
            <div className="h-[220px]">
              {conflict ? (
                <div className="grid h-full grid-cols-[1fr_220px]">
                  <DiffEditor height="100%" original={conflict.base} modified={conflict.merged} language={editorLanguage(conflict.path)} theme="vs-dark" />
                  <div className="space-y-2 overflow-y-auto border-l border-black/[0.06] dark:border-white/10 p-3 text-xs bg-slate-900 text-white">
                    <p className="font-semibold text-amber-400">Three-way conflict: {conflict.path}</p>
                    <button onClick={() => void resolveConflict(conflict, 'local')} className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium">Keep Local</button>
                    <button onClick={() => void resolveConflict(conflict, 'remote')} className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium">Keep Remote</button>
                    <button onClick={() => void resolveConflict(conflict, 'merge')} className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium">Use Diff3 Result</button>
                    <button onClick={() => setConflicts([])} className="w-full py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium">Cancel Pull</button>
                  </div>
                </div>
              ) : reviewProposal ? (
                <div className="grid h-full grid-cols-[1fr_290px]">
                  <DiffEditor height="100%" original={reviewProposal.baseline} modified={reviewContent} language={editorLanguage(reviewProposal.path)} theme="vs-dark" />
                  <div className="overflow-y-auto border-l border-black/[0.06] dark:border-white/10 p-3 text-xs bg-slate-900 text-white space-y-2">
                    <select value={reviewProposal.path} onChange={event => setReviewPath(event.target.value)} className="w-full h-8 rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs">
                      {reviewProposals.map(row => <option key={row.path} value={row.path}>{row.path}</option>)}
                    </select>
                    {reviewProposal.hunks.map((hunk, index) => (
                      <div key={hunk.id} className="border border-slate-800 p-2 rounded-lg bg-slate-950">
                        <p className="mb-1.5 text-slate-400 text-[11px]">Hunk {index + 1} · lines {hunk.oldStart + 1}-{Math.max(hunk.oldStart + 1, hunk.oldEnd)}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setReviewDecisions(current => ({ ...current, [reviewProposal.path]: { ...(current[reviewProposal.path] || {}), [hunk.id]: true } }))} className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${reviewDecisions[reviewProposal.path]?.[hunk.id] === true ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}>Accept</button>
                          <button onClick={() => setReviewDecisions(current => ({ ...current, [reviewProposal.path]: { ...(current[reviewProposal.path] || {}), [hunk.id]: false } }))} className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${reviewDecisions[reviewProposal.path]?.[hunk.id] === false ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>Reject</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => void completeExecutionReview()} className="w-full py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white font-bold text-xs" disabled={!executionRun?.steps.some(row => row.stage === 'security' && row.status === 'completed')}>Apply Reviewed Hunks</button>
                  </div>
                </div>
              ) : changed[0] ? (
                <DiffEditor height="100%" original={changed[0].savedContent} modified={changed[0].content} language={changed[0].language} theme="vs-dark" />
              ) : (
                <div className="p-6 text-xs font-medium text-slate-500">No pending changes or conflicts.</div>
              )}
            </div>
          )}
          {bottomPanel === 'ai' && (
            <pre className="h-[220px] overflow-y-auto p-4 text-xs font-mono text-slate-300 bg-slate-950 custom-scrollbar">{plan}</pre>
          )}
          {bottomPanel === 'preview' && (
            previewUrl ? (
              <iframe title="Live preview" src={previewUrl} className="h-full w-full bg-white" sandbox="allow-scripts allow-forms allow-modals allow-same-origin" />
            ) : (
              <div className="p-6 text-xs font-medium text-slate-500">Start a development server to view live preview.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

