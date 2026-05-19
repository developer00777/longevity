import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { format } from 'date-fns';

export function SlotsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [physicianId, setPhysicianId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const { data: physicians } = useQuery({
    queryKey: ['physicians'],
    queryFn: async () => { const { data } = await supabase.from('physicians').select('*'); return data ?? []; },
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['admin-slots'],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultation_slots')
        .select('*, physician:physicians(*)')
        .order('start_time', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const createSlot = useMutation({
    mutationFn: async () => {
      await supabase.from('consultation_slots').insert({ physician_uuid: physicianId, start_time: startTime, end_time: endTime });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-slots'] }); setShowForm(false); setStartTime(''); setEndTime(''); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('consultation_slots').update({ status }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-slots'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Consultation Slots</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage physician availability</p>
        </div>
        <Button label="+ Add Slot" onClick={() => setShowForm(!showForm)} />
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>New Consultation Slot</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Physician</label>
              <select value={physicianId} onChange={e => setPhysicianId(e.target.value)}>
                <option value="">Select physician...</option>
                {physicians?.map((p: any) => <option key={p.uuid} value={p.uuid}>Dr. {p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>End Time</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button label="Create Slot" onClick={() => createSlot.mutate()} loading={createSlot.isPending} disabled={!physicianId || !startTime || !endTime} />
            <Button label="Cancel" variant="ghost" onClick={() => setShowForm(false)} />
          </div>
        </Card>
      )}

      {isLoading && <Spinner />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slots?.map((slot: any) => (
          <Card key={slot.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. {slot.physician?.name ?? '—'}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                  {format(new Date(slot.start_time), 'EEE, MMM d · h:mm a')} → {format(new Date(slot.end_time), 'h:mm a')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge status={slot.status} />
                {slot.status === 'open' && <Button label="Block" variant="outline" onClick={() => updateStatus.mutate({ id: slot.id, status: 'blocked' })} style={{ height: 32, padding: '0 12px', fontSize: 12 }} />}
                {slot.status === 'blocked' && <Button label="Unblock" variant="outline" onClick={() => updateStatus.mutate({ id: slot.id, status: 'open' })} style={{ height: 32, padding: '0 12px', fontSize: 12 }} />}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
