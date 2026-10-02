import '@livekit/components-styles';
import { GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, ControlBar, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader2, Video, X, Minimize2, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceCall } from './useWorkspaceCall';

interface VideoCallProps {
  onClose: () => void;
  workspaceId?: string;
  isPIP?: boolean;
  onTogglePIP?: () => void;
}

function CameraStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

function CallNotice({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/95">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border-inverse-strong bg-surface-primary/10 p-8 text-center backdrop-blur-xl">
        <VideoOff className="mx-auto mb-4 h-10 w-10 text-text-disabled" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-text-disabled">{detail}</p>
        <Button className="mt-6" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function VideoCall({ onClose, workspaceId, isPIP = false, onTogglePIP }: VideoCallProps) {
  const session = useWorkspaceCall(workspaceId);

  if (session.state === 'loading') {
    return (
      <CallNotice title="Connecting live call" detail="Requesting a secure room token for this workspace." onClose={onClose} />
    );
  }
  if (session.state === 'unavailable') {
    return (
      <CallNotice
        title="Live video is not configured"
        detail={session.reason === 'live_calls_not_configured'
          ? 'The deployment has no LiveKit credentials, so audio/video calls cannot start yet.'
          : 'This workspace call is not available right now.'}
        onClose={onClose}
      />
    );
  }
  if (session.state === 'error' || !session.token || !session.url) {
    return (
      <CallNotice
        title="Live call could not start"
        detail={session.reason || 'The call service rejected the request. Workspace membership is required.'}
        onClose={onClose}
      />
    );
  }

  if (isPIP) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-lg border-2 border-brand-primary bg-brand-secondary shadow-2xl">
        <LiveKitRoom
          serverUrl={session.url}
          token={session.token}
          connect
          audio
          video={session.canPublish !== false}
          onDisconnected={onClose}
        >
          <div className="relative aspect-video bg-background-inverse">
            <CameraStage />
            <div className="absolute right-3 top-3 flex gap-2">
              {onTogglePIP && (
                <Button size="sm" variant="secondary" className="h-8 w-8 bg-black/50 p-0 hover:bg-black/70" onClick={onTogglePIP} aria-label="Expand call">
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="secondary" className="h-8 w-8 bg-black/50 p-0 hover:bg-black/70" onClick={onClose} aria-label="Close call">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-secondary">
      <div className="flex h-16 items-center justify-between border-b border-border-inverse-strong px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-primary/10 p-2">
            <Video className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Workspace Call</h2>
            <p className="text-sm text-text-disabled">{session.room}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onTogglePIP && (
            <Button variant="ghost" size="sm" className="text-white hover:bg-surface-primary/10" onClick={onTogglePIP}>
              <Minimize2 className="mr-2 h-4 w-4" />
              Minimize
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-white hover:bg-surface-primary/10" onClick={onClose} aria-label="Close call">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <LiveKitRoom
        serverUrl={session.url}
        token={session.token}
        connect
        audio
        video={session.canPublish !== false}
        onDisconnected={onClose}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <div className="flex-1 p-6" style={{ minHeight: 0 }}>
          <CameraStage />
        </div>
        <div className="flex h-20 items-center justify-center border-t border-border-inverse-strong">
          <ControlBar controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: true }} />
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
