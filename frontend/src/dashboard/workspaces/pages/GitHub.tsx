import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Code, GitBranch, GitCommit, Github, GitPullRequest, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { listActivity, listConnectors } from '../lib/api/connectors';
import { workspacePost } from '../lib/api/client';
import type { ActivityEvent, Connector } from '../lib/types';

function formatTimestamp(value?: string): string {
  if (!value) return 'No sync recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GH';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function resourceName(resource: string): string {
  const clean = resource.replace(/^github[:/]/i, '').replace(/^repos?[:/]/i, '');
  const parts = clean.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || clean || resource;
}

function statusClass(status: Connector['status'] | undefined): string {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-8 text-center text-slate-900 dark:text-white">
      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-black/[0.06] dark:border-white/10 last:border-0">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-[#20C997] text-slate-950 text-xs font-bold">
          {initials(activity.kind)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-slate-800 dark:text-slate-200">{activity.summary || activity.kind}</p>
        <span className="text-xs text-slate-400 dark:text-slate-500">{formatTimestamp(activity.at)}</span>
      </div>
    </div>
  );
}

export function GitHub() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listConnectors(), listActivity('github')])
      .then(([connectorRows, activityRows]) => {
        setConnectors(connectorRows);
        setActivity(activityRows);
      })
      .catch((err) => {
        setConnectors([]);
        setActivity([]);
        setError(err instanceof Error ? err.message : 'Live GitHub workspace data is unavailable.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const github = connectors.find((connector) => connector.id === 'github');
  const resources = github?.resources ?? [];
  const pullRequestActivity = useMemo(
    () => activity.filter((item) => /pull request|\bpr\b|merge/i.test(item.summary)),
    [activity],
  );
  const branchActivity = useMemo(
    () => activity.filter((item) => /branch|commit|push/i.test(item.summary)),
    [activity],
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors">
      <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-white/10 rounded-xl border border-black/[0.08] dark:border-white/10">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                GitHub Integration
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {github ? `${github.name} is ${github.status}` : 'No live GitHub connector is attached'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading} className="rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
              <RefreshCw className="w-4 h-4 mr-2 text-[#20C997]" />
              Refresh
            </Button>
            <Button
              className="bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-sm transition-all"
              onClick={async () => {
                const repoName = window.prompt('Enter the GitHub repository URL or name:');
                if (!repoName?.trim()) return;
                try {
                  await workspacePost('/connectors', {
                    id: 'github',
                    name: 'GitHub',
                    category: 'Source Control',
                    status: 'connected',
                    authType: 'oauth2',
                    capabilities: ['read', 'write'],
                    tools: [],
                    resources: [...resources, repoName.trim()],
                  });
                  toast.success(`Repository "${repoName.trim()}" added successfully.`);
                  load();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to add repository connector.');
                }
              }}
            >
              <Github className="w-4 h-4 mr-2" />
              New Repository
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Loading live GitHub workspace data...</p>}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
            GitHub data could not be loaded: {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 mb-6 text-slate-900 dark:text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusClass(github?.status)}`} />
                <h2 className="font-bold text-slate-900 dark:text-white">{github?.name ?? 'GitHub connector'}</h2>
                <Badge variant="outline" className="border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300">{github?.status ?? 'missing'}</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {github
                  ? `${github.capabilities.length} capabilities, ${github.tools.length} tools, ${resources.length} linked resources`
                  : 'Connect GitHub from workspace connectors to populate live repository resources.'}
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">Last sync: {formatTimestamp(github?.lastSync)}</span>
          </div>
        </div>

        <Tabs defaultValue="repos" className="w-full">
          <TabsList className="mb-6 bg-slate-100 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-xl p-1">
            <TabsTrigger value="repos" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <Code className="w-4 h-4 mr-2" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="prs" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <GitPullRequest className="w-4 h-4 mr-2" />
              Pull Requests
            </TabsTrigger>
            <TabsTrigger value="branches" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <GitBranch className="w-4 h-4 mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <GitCommit className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repos" className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource}
                className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 hover:shadow-lg transition-all text-slate-900 dark:text-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{resourceName(resource)}</h3>
                      <Badge className="bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 font-medium">Live resource</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{resource}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
                      <span>Source connector: GitHub</span>
                      <span>Updated {formatTimestamp(github?.lastSync)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    onClick={() => {
                      const url = resource.startsWith('http')
                        ? resource
                        : resource.includes('/')
                          ? `https://github.com/${resourceName(resource)}`
                          : null;
                      if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } else {
                        toast.info(`Repository: ${resourceName(resource)}`);
                      }
                    }}
                  >
                    View Repository
                  </Button>
                </div>
              </div>
            ))}
            {!loading && resources.length === 0 && (
              <EmptyState>No GitHub repository resources are persisted for this workspace yet.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="prs" className="space-y-4">
            {pullRequestActivity.map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white">
                <div className="flex items-start gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusClass(github?.status)} mt-2`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.summary || item.kind}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatTimestamp(item.at)}</p>
                  </div>
                  <Badge className="bg-[#20C997] text-slate-950 font-bold">{item.kind}</Badge>
                </div>
              </div>
            ))}
            {!loading && pullRequestActivity.length === 0 && (
              <EmptyState>No live pull request activity is recorded for this workspace yet.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="branches" className="space-y-4">
            {branchActivity.map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-[#20C997]" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.summary || item.kind}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Updated {formatTimestamp(item.at)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300">{item.kind}</Badge>
                </div>
              </div>
            ))}
            {!loading && branchActivity.length === 0 && (
              <EmptyState>No live branch or commit activity is recorded for this workspace yet.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activity.map((item) => (
                  <ActivityRow key={item.id} activity={item} />
                ))}
                {!loading && activity.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No live GitHub activity reports are recorded yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
