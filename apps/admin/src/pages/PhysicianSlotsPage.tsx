import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAdminAuthStore } from '../stores/auth.store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const SLOT_DURATION_MINS = 30;

export function PhysicianSlotsPage() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuthStore();
  const physicianId = adminUser?.linked_physician_uuid;

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [bulkDays, setBulkDays] = useState<string[]>([]);
  const [bulkTimes, setBulkTimes] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: mySlots, isLoading } = useQuery({
    queryKey: ['physician-own-slots', physicianId],
    enabled: !!physicianId,
    queryFn: async () => {
      const { data: slots } = await supabase
        .from('consultation_slots')
        .select('id, start_time, end_time, status')
        .eq('physician_uuid', physicianId!)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(60);

      if (!slots?.length) return [];

      // Fetch consultations for booked slots
      const bookedIds = slots.filter(s => s.status === 'booked').map(s => s.id);
      let consultationMap: Record<string, any> = {};

      if (bookedIds.length) {
        const { data: consultations } = await supabase
          .from('consultations')
          .select('id, slot_id, patient_uuid')
          .in('slot_id', bookedIds)
          .neq('status', 'cancelled');

        const patientIds = (consultations ?? []).map(c => c.patient_uuid).filter(Boolean);
        let patientMap: Record<string, any> = {};

        if (patientIds.length) {
          const { data: users } = await supabase
            .from('users')
            .select('uuid, name')
            .in('uuid', patientIds);
          (users ?? []).forEach((u: any) => { patientMap[u.uuid] = u; });
        }

        (consultations ?? []).forEach((c: any) => {
          consultationMap[c.slot_id] = { ...c, patient: patientMap[c.patient_uuid] ?? null };
        });
      }

      return slots.map(slot => ({ ...slot, consultation: consultationMap[slot.id] ?? null }));
    },
  });

  function makeSlot(date: string, time: string) {
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + SLOT_DURATION_MINS * 60 * 1000);
    return { physician_uuid: physicianId, start_time: start.toISOString(), end_time: end.toISOString() };
  }

  const createSlots = useMutation({
    mutationFn: async (slots: object[]) => {
      const { error } = await supabase.from('consultation_slots').insert(slots);
      if (error) throw error;
    },
    onSuccess: (_, slots) => {
      queryClient.invalidateQueries({ queryKey: ['physician-own-slots'] });
      setSelectedTimes([]);
      setBulkDays([]);
      setBulkTimes([]);
      setSuccessMsg(`✅ ${(slots as any[]).length} slot(s) created successfully`);
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('consultation_slots').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['physician-own-slots'] }),
  });

  function toggleTime(time: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(time) ? list.filter(t => t !== time) : [...list, time]);
  }

  function handleCreateSingle() {
    const slots = selectedTimes.map(t => makeSlot(selectedDate, t));
    createSlots.mutate(slots);
  }

  function handleCreateBulk() {
    const slots = bulkDays.flatMap(day => bulkTimes.map(t => makeSlot(day, t)));
    createSlots.mutate(slots);
  }

  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d') };
  });

  if (!physicianId) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Physician profile not linked</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Ask your admin to link your account to a physician profile.</div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Manage My Slots</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Create your availability for patient bookings</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setMode('single')} style={{ padding: '8px 20px', borderRadius: 10, background: mode === 'single' ? 'var(--primary)' : 'var(--surface)', color: mode === 'single' ? '#000' : 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', fontSize: 14, cursor: 'pointer' }}>
          Single Day
        </button>
        <button onClick={() => setMode('bulk')} style={{ padding: '8px 20px', borderRadius: 10, background: mode === 'bulk' ? 'var(--primary)' : 'var(--surface)', color: mode === 'bulk' ? '#000' : 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)', fontSize: 14, cursor: 'pointer' }}>
          Multiple Days at Once
        </button>
      </div>

      {/* Single day mode */}
      {mode === 'single' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Add slots for a specific day</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Date</label>
            <input type="date" value={selectedDate} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 10 }}>
              Select time slots (30 min each) — tap to toggle
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIME_SLOTS.map(t => {
                const active = selectedTimes.includes(t);
                return (
                  <button key={t} onClick={() => toggleTime(t, selectedTimes, setSelectedTimes)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: active ? 'var(--primary)' : 'var(--surface-elevated, #1E1E1E)',
                    color: active ? '#000' : 'var(--text-secondary)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          {selectedTimes.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button label={`Create ${selectedTimes.length} Slot${selectedTimes.length > 1 ? 's' : ''}`} onClick={handleCreateSingle} loading={createSlots.isPending} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>on {format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d')}</span>
            </div>
          )}
        </Card>
      )}

      {/* Bulk mode */}
      {mode === 'bulk' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Add the same slots across multiple days</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 10 }}>Select days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {next14Days.map(({ value, label }) => {
                const active = bulkDays.includes(value);
                return (
                  <button key={value} onClick={() => toggleTime(value, bulkDays, setBulkDays)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: active ? 'var(--primary)' : 'var(--surface-elevated, #1E1E1E)',
                    color: active ? '#000' : 'var(--text-secondary)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 10 }}>Select times for each day</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIME_SLOTS.map(t => {
                const active = bulkTimes.includes(t);
                return (
                  <button key={t} onClick={() => toggleTime(t, bulkTimes, setBulkTimes)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: active ? 'var(--primary)' : 'var(--surface-elevated, #1E1E1E)',
                    color: active ? '#000' : 'var(--text-secondary)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          {bulkDays.length > 0 && bulkTimes.length > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button label={`Create ${bulkDays.length * bulkTimes.length} Slots`} onClick={handleCreateBulk} loading={createSlots.isPending} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {bulkTimes.length} time{bulkTimes.length > 1 ? 's' : ''} × {bulkDays.length} day{bulkDays.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Success message */}
      {successMsg && (
        <div style={{ background: '#00C89622', border: '1px solid var(--primary)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: 'var(--primary)', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Existing upcoming slots */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My Upcoming Slots</h2>
        {isLoading && <Spinner />}
        {!isLoading && !mySlots?.length && (
          <Card style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
            No upcoming slots. Create some above so patients can book.
          </Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mySlots?.map((slot: any) => {
            const consultation = slot.consultation;
            const isBooked = slot.status === 'booked';
            return (
              <Card key={slot.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {format(new Date(slot.start_time), 'EEE, MMM d · h:mm a')} – {format(new Date(slot.end_time), 'h:mm a')}
                    </div>
                    {isBooked && consultation?.patient?.name && (
                      <div style={{ color: 'var(--primary)', fontSize: 13, marginTop: 4 }}>
                        🩺 Booked by {consultation.patient.name}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge status={slot.status} />
                    {!isBooked && (
                      <Button
                        label="Delete"
                        variant="danger"
                        onClick={() => deleteSlot.mutate(slot.id)}
                        style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
