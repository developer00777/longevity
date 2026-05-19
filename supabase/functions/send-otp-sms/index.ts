import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface SmsHookPayload {
  user: { phone: string };
  otp: string;
}

serve(async (req) => {
  const payload: SmsHookPayload = await req.json();
  const { phone } = payload.user;
  const { otp } = payload;

  const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY');
  const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID');
  const MSG91_SENDER_ID = Deno.env.get('MSG91_SENDER_ID') ?? 'LONGEV';

  if (!MSG91_AUTH_KEY) {
    console.warn('[send-otp-sms] MSG91_AUTH_KEY not set — Supabase will fallback to email OTP');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const mobile = phone.replace('+', '');
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: MSG91_AUTH_KEY },
    body: JSON.stringify({ template_id: MSG91_TEMPLATE_ID, mobile, authkey: MSG91_AUTH_KEY, otp, sender: MSG91_SENDER_ID }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'SMS delivery failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
