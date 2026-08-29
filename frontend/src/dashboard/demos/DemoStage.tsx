import "@livekit/components-styles";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { RtcSession } from "@/lib/demo/rtc";

function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: "60vh" }}>
      <ParticipantTile />
    </GridLayout>
  );
}

/** Self-contained LiveKit room. Knows nothing about demo lifecycle. */
export default function DemoStage({ session }: { session: RtcSession }) {
  return (
    <LiveKitRoom serverUrl={session.url} token={session.token} connect audio video={session.canPublish}
      style={{ borderRadius: 12, overflow: "hidden" }}>
      <Stage />
      <RoomAudioRenderer />
      {session.canPublish && <ControlBar />}
    </LiveKitRoom>
  );
}
