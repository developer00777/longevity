import { Linking } from 'react-native';
import type { SessionHandle } from '@longevity/shared';

export function createZoomSession(joinUrl: string): SessionHandle {
  return {
    provider: 'zoom',
    join: async () => { await Linking.openURL(joinUrl); },
    leave: async () => {},
    toggleMute: () => {},
    toggleCamera: () => {},
    onRemoteJoin: (_cb) => () => {},
    onRemoteLeave: (_cb) => () => {},
  };
}
