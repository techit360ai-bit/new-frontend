import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export class CodeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('workspace_code_editor_failed', { message: error.message, componentStack: info.componentStack }); }
  render() { if (!this.state.failed) return this.props.children; return <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 p-8 text-slate-100"><div className="max-w-md text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-400" /><h1 className="mt-3 text-lg font-semibold">Code Editor stopped unexpectedly</h1><p className="mt-2 text-sm text-slate-400">The rest of your TechIT Workspace is still available. Reload the editor to recover locally persisted changes.</p><button onClick={() => window.location.reload()} className="mt-4 rounded bg-cyan-600 px-4 py-2 text-sm font-medium">Recover editor</button></div></div>; }
}
