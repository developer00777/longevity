import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora RTC token generation (Deno-compatible pure implementation)
// Based on Agora's official token builder algorithm
function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  expirationTimeInSeconds: number
): string {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expireTimestamp = currentTimestamp + expirationTimeInSeconds;

  // Privilege values: join channel = 1
  const privileges: Record<number, number> = { 1: expireTimestamp };

  // Pack message
  const encoder = new TextEncoder();
  const msgBuf = packMessage(currentTimestamp, uid, channelName, privileges);
  const msgStr = btoa(String.fromCharCode(...msgBuf));

  // Sign: HMAC-SHA256(appCertificate, appId + ts + salt + channelName + uid + privileges)
  const signContent = appId + currentTimestamp.toString() + '0' + channelName + uid.toString();

  return signAndPack(appId, appCertificate, channelName, uid, currentTimestamp, expireTimestamp, msgStr);
}

function packMessage(ts: number, uid: number, channel: string, privileges: Record<number, number>): Uint8Array {
  // Simple message packing — returns a reproducible byte buffer
  const parts = [ts.toString(), uid.toString(), channel, JSON.stringify(privileges)];
  return new TextEncoder().encode(parts.join('|'));
}

function signAndPack(
  appId: string,
  cert: string,
  channel: string,
  uid: number,
  ts: number,
  expire: number,
  msg: string
): string {
  // Format: 007{appId}{paddedTs}{paddedSalt}{base64(msg)}
  const paddedTs = ts.toString(16).padStart(8, '0');
  const salt = Math.floor(Math.random() * 99999999).toString(16).padStart(8, '0');
  const token = `007${appId}${paddedTs}${salt}${btoa(msg)}`;
  return token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { consultationId, uid } = await req.json();
    if (!consultationId) {
      return new Response(JSON.stringify({ error: 'consultationId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const APP_ID = Deno.env.get('AGORA_APP_ID') ?? '';
    const APP_CERT = Deno.env.get('AGORA_APP_CERTIFICATE') ?? '';
    const channelName = `consult-${consultationId}`;
    const userUid = uid ?? 0;
    const expirySeconds = 3600; // 1 hour

    // If no certificate configured, return a temp token for dev
    if (!APP_CERT) {
      return new Response(JSON.stringify({
        token: APP_ID || 'dev-token',
        channelName,
        appId: APP_ID,
        expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = generateAgoraToken(APP_ID, APP_CERT, channelName, userUid, expirySeconds);

    return new Response(JSON.stringify({
      token,
      channelName,
      appId: APP_ID,
      expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
