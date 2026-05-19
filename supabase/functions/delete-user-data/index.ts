import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { userId } = await req.json();
  const supabase = createClient(
    Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  );

  await supabase.from('consultations').update({ patient_uuid: null }).eq('patient_uuid', userId);
  await supabase.from('health_metrics').delete().eq('uuid', userId);
  await supabase.from('therapy_bookings').delete().eq('patient_uuid', userId);
  await supabase.from('users').delete().eq('uuid', userId);
  await supabase.auth.admin.deleteUser(userId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
