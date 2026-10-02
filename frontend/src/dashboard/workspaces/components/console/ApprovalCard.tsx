import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApprovalRequest } from '../../lib/types';

interface Props {
  approval: ApprovalRequest;
  onResolve: (decision: 'approved' | 'rejected') => void;
}

export function ApprovalCard({ approval, onResolve }: Props) {
  const resolved = approval.resolved;
  return (
    <div className="border border-status-warning bg-status-warning-soft rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-status-warning" />
        <span className="text-sm font-semibold text-status-warning">Approval required</span>
      </div>
      <p className="text-sm text-text-secondary mb-3">{approval.summary}</p>
      <p className="text-xs text-text-muted mb-3 font-mono">{approval.connectorId}.{approval.action}</p>
      {resolved ? (
        <span className={`text-sm font-medium ${resolved === 'approved' ? 'text-status-success' : 'text-status-error'}`}>
          {resolved === 'approved' ? 'Approved' : 'Rejected'}
        </span>
      ) : (
        <div className="flex gap-2">
          <Button className="bg-status-success hover:bg-status-success" onClick={() => onResolve('approved')}>Approve</Button>
          <Button variant="outline" onClick={() => onResolve('rejected')}>Reject</Button>
        </div>
      )}
    </div>
  );
}
