export type SessionHandle = {
  provider: 'agora' | 'zoom';
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  onRemoteJoin: (cb: () => void) => () => void;
  onRemoteLeave: (cb: () => void) => () => void;
};

export type SessionError =
  | { code: 'TOKEN_EXPIRED' }
  | { code: 'NETWORK_ERROR' }
  | { code: 'PROVIDER_UNAVAILABLE'; fallbackUrl?: string };
