import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, specialization } = await req.json();

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'email, password and name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client — can create auth users.
    // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase runtime.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('APP_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. Create auth user with email already confirmed
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: authErr?.message ?? 'Failed to create user' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // 2. Create physician profile
    const { data: physician, error: physErr } = await supabase
      .from('physicians')
      .insert({ uuid: userId, name, specialization: specialization ?? null })
      .select('uuid')
      .single();

    if (physErr) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: physErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create admin_users row as physician role
    const { error: adminErr } = await supabase.from('admin_users').insert({
      uuid: userId,
      role: 'physician',
      linked_physician_uuid: physician.uuid,
    });

    if (adminErr) {
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: adminErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, userId, name, email }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
