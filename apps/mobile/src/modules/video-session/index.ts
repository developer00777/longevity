import type { SessionHandle, SessionError } from '@longevity/shared';
import { supabase } from '../../lib/supabase';

export type { SessionHandle, SessionError };

export async function createSession(consultationId: string): Promise<SessionHandle | SessionError> {
  try {
    const { data: consultation } = await supabase
      .from('consultations')
      .select('agora_channel, video_link, video_type')
      .eq('id', consultationId)
      .single();

    if (!consultation) return { code: 'PROVIDER_UNAVAILABLE' };

    if (consultation.video_type === 'zoom' && consultation.video_link) {
      const { createZoomSession } = await import('./zoom.adapter');
      return createZoomSession(consultation.video_link);
    }

    try {
      const { createAgoraSession } = await import('./agora.adapter');
      return createAgoraSession(consultationId, consultation.agora_channel ?? `consult-${consultationId}`);
    } catch {
      if (consultation.video_link) {
        const { createZoomSession } = await import('./zoom.adapter');
        return createZoomSession(consultation.video_link);
      }
      return { code: 'PROVIDER_UNAVAILABLE' };
    }
  } catch {
    return { code: 'NETWORK_ERROR' };
  }
}
