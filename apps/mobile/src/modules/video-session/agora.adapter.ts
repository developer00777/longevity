import type { SessionHandle } from '@longevity/shared';

export async function createAgoraSession(consultationId: string, channelName: string): Promise<SessionHandle> {
  // In production: import react-native-agora and use RtcEngine
  // For web/MVP: return a mock handle that logs actions
  let remoteJoinCb: (() => void) | null = null;
  let remoteLeaveCb: (() => void) | null = null;

  return {
    provider: 'agora',
    join: async () => { console.log(`[Agora] Joining channel: ${channelName}`); },
    leave: async () => { console.log(`[Agora] Leaving channel: ${channelName}`); },
    toggleMute: () => { console.log('[Agora] Toggle mute'); },
    toggleCamera: () => { console.log('[Agora] Toggle camera'); },
    onRemoteJoin: (cb) => { remoteJoinCb = cb; return () => { remoteJoinCb = null; }; },
    onRemoteLeave: (cb) => { remoteLeaveCb = cb; return () => { remoteLeaveCb = null; }; },
  };
}
