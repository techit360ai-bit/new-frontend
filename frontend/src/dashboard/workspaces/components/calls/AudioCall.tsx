import '@livekit/components-styles';
import { ControlBar, LiveKitRoom, RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import { Loader2, PhoneOff, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useWorkspaceCall } from './useWorkspaceCall';

interface AudioCallProps {
  onClose: () => void;
  workspaceId?: string;
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function Participants() {
  const participants = useParticipants();
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {participants.map((participant) => (
        <div key={participant.identity} className="flex flex-col items-center gap-2">
          <Avatar className="h-20 w-20 ring-2 ring-white/20">
            <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-primary-hover text-2xl text-white">
              {initials(participant.name || participant.identity)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-white/80">{participant.name || participant.identity}{participant.isLocal ? ' (you)' : ''}</span>
        </div>
      ))}
    </div>
  );
}

function AudioNotice({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-secondary via-feature-call-overlay to-brand-primary/20">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-surface-primary/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <MicOff className="mx-auto mb-4 h-10 w-10 text-white/70" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-white/60">{detail}</p>
        <Button className="mt-6" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function AudioCall({ onClose, workspaceId }: AudioCallProps) {
  const session = useWorkspaceCall(workspaceId);

  if (session.state === 'loading') {
    return <AudioNotice title="Connecting live call" detail="Requesting a secure room token for this workspace." onClose={onClose} />;
  }
  if (session.state === 'unavailable') {
    return (
      <AudioNotice
        title="Live audio is not configured"
        detail={session.reason === 'live_calls_not_configured'
          ? 'The deployment has no LiveKit credentials, so audio calls cannot start yet.'
          : 'This workspace call is not available right now.'}
        onClose={onClose}
      />
    );
  }
  if (session.state === 'error' || !session.token || !session.url) {
    return (
      <AudioNotice
        title="Live call could not start"
        detail={session.reason || 'The call service rejected the request. Workspace membership is required.'}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-secondary via-feature-call-overlay to-brand-primary/20">
      <LiveKitRoom
        serverUrl={session.url}
        token={session.token}
        connect
        audio
        video={false}
        onDisconnected={onClose}
        className="w-full max-w-lg"
      >
        <div className="mx-4 rounded-3xl border border-white/20 bg-surface-primary/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-status-success px-4 py-1 text-xs font-medium text-white">
              <Loader2 className="h-3 w-3 animate-spin" /> Connected
            </div>
            <Participants />
            <p className="mt-4 text-white/60">{session.room}</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <ControlBar controls={{ microphone: true, camera: false, screenShare: false, chat: false, leave: true }} />
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" className="text-white/60 hover:bg-surface-primary/10 hover:text-white" onClick={onClose}>
              <PhoneOff className="mr-2 h-4 w-4" /> Leave
            </Button>
          </div>
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
