import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAdminAuthStore } from '../stores/auth.store';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { format, addMinutes } from 'date-fns';

function PhysicianSetupPanel() {
  const { adminUser } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Link physician state
  const [linkAdminId, setLinkAdminId] = useState('');
  const [linkPhysicianId, setLinkPhysicianId] = useState('');
  const [linkMsg, setLinkMsg] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  const { data: allAdminUsers } = useQuery({
    queryKey: ['admin-users-list'],
    enabled: adminUser?.role === 'admin',
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('uuid, role, linked_physician_uuid');
      return data ?? [];
    },
  });

  const { data: allPhysicians } = useQuery({
    queryKey: ['physicians'],
    enabled: adminUser?.role === 'admin',
    queryFn: async () => {
      const { data } = await supabase.from('physicians').select('uuid, name');
      return data ?? [];
    },
  });

  if (adminUser?.role !== 'admin') return null;

  async function handleCreate() {
    if (!email || !name || !password) return;
    setLoading(true); setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-physician`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email, password, name, specialization: spec }),
        }
      );
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? `Error ${res.status}`);
      setMsg(`✅ ${name} created! Login: ${email} / ${password}`);
      setEmail(''); setName(''); setSpec(''); setPassword('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['physicians'] });
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLink() {
    if (!linkAdminId || !linkPhysicianId) return;
    setLinkLoading(true); setLinkMsg('');
    const { error } = await supabase
      .from('admin_users')
      .update({ linked_physician_uuid: linkPhysicianId })
      .eq('uuid', linkAdminId);
    setLinkLoading(false);
    if (error) { setLinkMsg(`❌ ${error.message}`); return; }
    setLinkMsg('✅ Physician linked successfully');
    setLinkAdminId(''); setLinkPhysicianId('');
    queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    setTimeout(() => setLinkMsg(''), 4000);
  }

  const unlinkedPhysicianAccounts = (allAdminUsers ?? []).filter(
    (u: any) => u.role === 'physician' && !u.linked_physician_uuid
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Create physician */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>➕ Add Physician / Staff</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          Creates a login account + physician profile in one step.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Full Name *</label>
            <input placeholder="Dr. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Email *</label>
            <input type="email" placeholder="priya@longevity.app" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Password *</label>
            <input type="text" placeholder="Temp password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Specialization</label>
            <input placeholder="Longevity & Preventive Medicine" value={spec} onChange={e => setSpec(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button label="Create Physician Account" onClick={handleCreate} loading={loading} disabled={!email || !name || !password} />
        </div>
        {msg && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? '#00C89622' : '#FF444422', color: msg.startsWith('✅') ? 'var(--primary)' : 'var(--error)', fontSize: 13, fontWeight: 600 }}>
            {msg}
          </div>
        )}
      </Card>

      {/* Link physician account to physician profile */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔗 Link Physician Account to Profile</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          After creating a physician account, link it to their physician profile so they can see their schedule and slots.
          {unlinkedPhysicianAccounts.length > 0 && (
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
              {' '}⚠️ {unlinkedPhysicianAccounts.length} account{unlinkedPhysicianAccounts.length > 1 ? 's' : ''} not yet linked.
            </span>
          )}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Physician Account (admin_users)</label>
            <select value={linkAdminId} onChange={e => setLinkAdminId(e.target.value)}>
              <option value="">Select account...</option>
              {(allAdminUsers ?? [])
                .filter((u: any) => u.role === 'physician')
                .map((u: any) => (
                  <option key={u.uuid} value={u.uuid}>
                    {u.uuid.slice(0, 8)}…{u.linked_physician_uuid ? ' ✓ linked' : ' ⚠ unlinked'}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Physician Profile</label>
            <select value={linkPhysicianId} onChange={e => setLinkPhysicianId(e.target.value)}>
              <option value="">Select physician profile...</option>
              {(allPhysicians ?? []).map((p: any) => (
                <option key={p.uuid} value={p.uuid}>Dr. {p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Button label="Link Account" onClick={handleLink} loading={linkLoading} disabled={!linkAdminId || !linkPhysicianId} />
        </div>
        {linkMsg && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: linkMsg.startsWith('✅') ? '#00C89622' : '#FF444422', color: linkMsg.startsWith('✅') ? 'var(--primary)' : 'var(--error)', fontSize: 13, fontWeight: 600 }}>
            {linkMsg}
          </div>
        )}
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'consultations' | 'therapies'>('consultations');

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'therapy_bookings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-therapy-bookings'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: consultations, isLoading: loadingC } = useQuery({
    queryKey: ['admin-consultations'],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      // Filter on the base table (slot start_time) via a subquery — Supabase ignores
      // .gte filters on joined foreign tables, so we fetch today's slot IDs first.
      const { data: todaySlots } = await supabase
        .from('consultation_slots')
        .select('id')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());
      const slotIds = (todaySlots ?? []).map((s: any) => s.id);
      if (!slotIds.length) return [];
      const { data } = await supabase
        .from('consultations')
        .select('*, slot:consultation_slots(*, physician:physicians(*)), patient:users(name, age, health_goals)')
        .in('slot_id', slotIds)
        .order('created_at');
      return data ?? [];
    },
  });

  const { data: therapyBookings, isLoading: loadingT } = useQuery({
    queryKey: ['admin-therapy-bookings'],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      // Same fix: filter therapy_slots directly first, then fetch bookings.
      const { data: todaySlots } = await supabase
        .from('therapy_slots')
        .select('id')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());
      const slotIds = (todaySlots ?? []).map((s: any) => s.id);
      if (!slotIds.length) return [];
      const { data } = await supabase
        .from('therapy_bookings')
        .select('*, therapy_slot:therapy_slots(*, therapy:therapies(*), room:rooms(*)), patient:users(name)')
        .in('therapy_slot_id', slotIds)
        .order('created_at');
      return data ?? [];
    },
  });

  function canJoinCall(slotStartTime: string) {
    const start = new Date(slotStartTime);
    const now = new Date();
    return now >= addMinutes(start, -5) && now <= addMinutes(start, 60);
  }

  const todayStr = format(new Date(), 'EEEE, MMMM d');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Today's Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{todayStr}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Consultations', value: consultations?.length ?? 0, icon: '🩺' },
          { label: 'Therapy Sessions', value: therapyBookings?.length ?? 0, icon: '💆' },
          { label: 'Upcoming', value: (consultations?.filter((c: any) => c.status === 'upcoming') ?? []).length, icon: '⏰' },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{stat.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--primary)', marginTop: 8 }}>{stat.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Tab switch */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['consultations', 'therapies'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '8px 20px', borderRadius: 10, background: view === v ? 'var(--primary)' : 'var(--surface)',
            color: view === v ? '#000' : 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', fontSize: 14,
          }}>
            {v === 'consultations' ? '🩺 Consultations' : '💆 Therapy Sessions'}
          </button>
        ))}
      </div>

      {/* Consultations list */}
      {view === 'consultations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingC && <Spinner />}
          {!loadingC && (!consultations || consultations.length === 0) && (
            <Card><p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No consultations today</p></Card>
          )}
          {consultations?.map((c: any) => (
            <Card key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.patient?.name ?? 'Patient'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    {c.slot?.start_time ? format(new Date(c.slot.start_time), 'h:mm a') : '—'} with Dr. {c.slot?.physician?.name ?? '—'}
                  </div>
                  {c.patient?.health_goals?.length > 0 && (
                    <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 4 }}>
                      Goals: {c.patient.health_goals.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge status={c.status} />
                  {canJoinCall(c.slot?.start_time) && (
                    <Button label="Join Call" onClick={() => navigate(`/consult/${c.id}`)} style={{ height: 36, padding: '0 16px', fontSize: 13 }} />
                  )}
                  <Button label="View Patient" variant="outline" onClick={() => navigate(`/patients/${c.patient_uuid}`)} style={{ height: 36, padding: '0 16px', fontSize: 13 }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Therapy bookings list */}
      {view === 'therapies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingT && <Spinner />}
          {!loadingT && (!therapyBookings || therapyBookings.length === 0) && (
            <Card><p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No therapy sessions today</p></Card>
          )}
          {therapyBookings?.map((b: any) => (
            <Card key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{b.patient?.name ?? 'Patient'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    {b.therapy_slot?.therapy?.name ?? '—'} · {b.therapy_slot?.start_time ? format(new Date(b.therapy_slot.start_time), 'h:mm a') : '—'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>📍 {b.therapy_slot?.room?.name ?? 'Facility'}</div>
                </div>
                <Badge status={b.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin-only: Quick physician setup */}
      <div style={{ marginTop: 32 }}>
        <PhysicianSetupPanel />
      </div>
    </div>
  );
}
