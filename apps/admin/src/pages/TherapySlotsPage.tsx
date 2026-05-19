import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
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

export function TherapySlotsPage() {
  const queryClient = useQueryClient();

  const [therapyId, setTherapyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [filterTherapy, setFilterTherapy] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: therapies } = useQuery({
    queryKey: ['therapies-all'],
    queryFn: async () => {
      const { data } = await supabase.from('therapies').select('id, name, duration_min').order('name');
      return data ?? [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, name, capacity').order('name');
      return data ?? [];
    },
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['therapy-slots-admin', filterTherapy],
    queryFn: async () => {
      let q = supabase
        .from('therapy_slots')
        .select('*, therapy:therapies(name), room:rooms(name)')
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(100);
      if (filterTherapy) q = q.eq('therapy_id', filterTherapy);
      const { data } = await q;
      return data ?? [];
    },
  });

  const createSlots = useMutation({
    mutationFn: async (newSlots: object[]) => {
      const { error } = await supabase.from('therapy_slots').insert(newSlots);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['therapy-slots-admin'] });
      setSelectedTimes([]);
      setSuccessMsg(`✅ ${(vars as any[]).length} slot(s) created`);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (e: any) => {
      setErrorMsg(`❌ ${e.message}`);
    },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('therapy_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['therapy-slots-admin'] }),
  });

  function toggleTime(t: string) {
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function handleCreate() {
    if (!therapyId || !roomId || !selectedDate || selectedTimes.length === 0) return;
    const therapy = (therapies as any[])?.find((t: any) => t.id === therapyId);
    const durationMs = (therapy?.duration_min ?? 60) * 60 * 1000;

    const newSlots = selectedTimes.map(time => {
      const start = new Date(`${selectedDate}T${time}:00`);
      const end = new Date(start.getTime() + durationMs);
      return {
        therapy_id: therapyId,
        room_id: roomId,
        start_time: start.toISOString(),
        capacity,
        booked_count: 0,
      };
    });
    createSlots.mutate(newSlots);
  }

  const selectedRoom = (rooms as any[])?.find((r: any) => r.id === roomId);
  const maxCapacity = selectedRoom?.capacity ?? 10;

  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d') };
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Therapy Slots</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Create time slots for therapies so patients can book them
        </p>
      </div>

      {/* ── Create form ── */}
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Create New Slots</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Pick a therapy, room, date and time(s). Each selected time becomes one bookable slot.
        </p>

        {/* Row 1: therapy + room + capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Therapy *</label>
            <select value={therapyId} onChange={e => setTherapyId(e.target.value)}>
              <option value="">Select therapy...</option>
              {(therapies as any[] ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.duration_min} min)</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Room *</label>
            <select value={roomId} onChange={e => { setRoomId(e.target.value); setCapacity(1); }}>
              <option value="">Select room...</option>
              {(rooms as any[] ?? []).map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} (max {r.capacity})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>
              Capacity (1–{maxCapacity})
            </label>
            <input
              type="number"
              min={1}
              max={maxCapacity}
              value={capacity}
              onChange={e => setCapacity(Math.min(maxCapacity, Math.max(1, Number(e.target.value))))}
            />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Date *</label>
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
              {next30Days.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 10 }}>
            Select start times — tap to toggle
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TIME_SLOTS.map(t => {
              const active = selectedTimes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTime(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: active ? 'var(--primary)' : 'var(--surface-elevated)',
                    color: active ? '#000' : 'var(--text-secondary)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            label={selectedTimes.length > 0 ? `Create ${selectedTimes.length} Slot${selectedTimes.length > 1 ? 's' : ''}` : 'Create Slots'}
            onClick={handleCreate}
            loading={createSlots.isPending}
            disabled={!therapyId || !roomId || selectedTimes.length === 0}
          />
          {selectedTimes.length > 0 && (
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              on {format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d')} · capacity {capacity}
            </span>
          )}
        </div>

        {successMsg && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#00C89622', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#FF444422', color: 'var(--error)', fontSize: 13, fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}
      </Card>

      {/* ── Existing slots ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upcoming Therapy Slots</h2>
        <select
          value={filterTherapy}
          onChange={e => setFilterTherapy(e.target.value)}
          style={{ maxWidth: 260 }}
        >
          <option value="">All therapies</option>
          {(therapies as any[] ?? []).map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (!slots || slots.length === 0) && (
        <Card>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
            No upcoming slots. Create some above so patients can book.
          </p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(slots ?? []).map((slot: any) => {
          const isFull = slot.booked_count >= slot.capacity;
          return (
            <Card key={slot.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{slot.therapy?.name ?? '—'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>
                    {format(new Date(slot.start_time), 'EEE, MMM d · h:mm a')}
                    &nbsp;·&nbsp;📍 {slot.room?.name ?? '—'}
                  </div>
                  <div style={{ color: isFull ? 'var(--error)' : 'var(--primary)', fontSize: 12, marginTop: 3, fontWeight: 600 }}>
                    {slot.booked_count} / {slot.capacity} booked{isFull ? ' · FULL' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge status={isFull ? 'completed' : 'open'} />
                  {slot.booked_count === 0 && (
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
  );
}
