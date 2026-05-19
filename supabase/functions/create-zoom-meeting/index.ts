import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function getZoomToken(): Promise<string | null> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  if (!accountId || !clientId || !clientSecret) return null;
  const creds = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

serve(async (req) => {
  const { consultationId, startTime, durationMin } = await req.json();
  const supabase = createClient(
    Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  );

  const token = await getZoomToken();
  if (!token) {
    console.warn('[create-zoom-meeting] Zoom not configured — skipping');
    return new Response(JSON.stringify({ success: true, video_link: null }), { status: 200 });
  }

  const hostId = Deno.env.get('ZOOM_HOST_USER_ID') ?? 'me';
  const meetingRes = await fetch(`https://api.zoom.us/v2/users/${hostId}/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'Longevity Consultation',
      type: 2,
      start_time: startTime,
      duration: durationMin ?? 30,
      settings: { join_before_host: true, waiting_room: false },
    }),
  });

  if (!meetingRes.ok) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  const meeting = await meetingRes.json();
  await supabase.from('consultations').update({ video_link: meeting.join_url }).eq('id', consultationId);
  return new Response(JSON.stringify({ success: true, video_link: meeting.join_url }), { status: 200 });
});
