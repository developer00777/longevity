import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { bookingId, type, startsAt, title } = await req.json();
  const startsAtMs = new Date(startsAt).getTime();
  const now = Date.now();

  const reminders = [
    { label: '24h', offsetMs: 24 * 60 * 60 * 1000, body: `Your ${type} is tomorrow` },
    { label: '1h', offsetMs: 60 * 60 * 1000, body: `Your ${type} starts in 1 hour` },
    { label: '10min', offsetMs: 10 * 60 * 1000, body: `Your ${type} starts in 10 minutes` },
  ];

  for (const r of reminders) {
    const sendAt = startsAtMs - r.offsetMs;
    if (sendAt > now) {
      console.log(`[reminders] ${bookingId} — ${r.label} at ${new Date(sendAt).toISOString()}: ${title}`);
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
