import type { ReactNode } from 'react';
import { Plug, Github, Figma, FileText, Brain, Boxes, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Connector, ConnectorId, ConnectorStatus } from '../../lib/types';

const ICONS: Record<ConnectorId, ReactNode> = {
  github: <Github className="w-6 h-6" />, figma: <Figma className="w-6 h-6" />,
  notion: <FileText className="w-6 h-6" />, ml: <Brain className="w-6 h-6" />,
  web3: <Boxes className="w-6 h-6" />,
};

const STATUS_STYLES: Record<ConnectorStatus, string> = {
  connected: 'bg-[#20c937]/10 text-[#20c937] border border-[#20c937]/30 font-medium',
  disconnected: 'bg-black/[0.05] dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-medium',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium',
};

interface Props {
  connector: Connector;
  onOpen: (c: Connector) => void;
  onToggle: (c: Connector) => void;
}

export function ConnectorCard({ connector, onOpen, onToggle }: Props) {
  const connected = connector.status === 'connected';
  return (
    <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 hover:shadow-lg transition-all text-slate-900 dark:text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff]">{ICONS[connector.id] ?? <Plug className="w-6 h-6" />}</div>
        <Badge className={STATUS_STYLES[connector.status]}>{connector.status}</Badge>
      </div>
      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{connector.name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{connector.category} • {connector.authType}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {connector.capabilities.map((c) => (<Badge key={c} variant="secondary" className="text-xs bg-black/[0.05] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-none rounded-lg">{c}</Badge>))}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{connector.tools.length} MCP tools exposed</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]" onClick={() => onOpen(connector)}>Details</Button>
        {connector.deepLink ? (
          <Button asChild variant="ghost" className="rounded-xl text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/10"><Link to={connector.deepLink}><ExternalLink className="w-4 h-4 mr-1" />Open</Link></Button>
        ) : (
          <Button className={connected ? 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/15 rounded-xl font-semibold' : 'bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all'} onClick={() => onToggle(connector)}>
            {connected ? 'Disconnect' : 'Connect'}
          </Button>
        )}
      </div>
    </div>
  );
}
