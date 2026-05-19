import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { format } from 'date-fns';

export function ConsultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { data: consult, isLoading } = useQuery({
    queryKey: ['consult', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultations')
        .select('*, slot:consultation_slots(*, physician:physicians(*)), patient:users(name, age, gender, height_cm, weight_kg, health_goals)')
        .eq('id', id!)
        .single();
      if (data?.notes) setNotes(data.notes);
      return data;
    },
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['patient-health', consult?.patient_uuid],
    enabled: !!consult?.patient_uuid,
    queryFn: async () => {
      const { data } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('uuid', consult!.patient_uuid)
        .order('recorded_at', { ascending: false })
        .limit(120);
      return data ?? [];
    },
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      await supabase.from('consultations').update({ notes }).eq('id', id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consult', id] });
      alert('Notes saved!');
    },
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>;
  if (!consult) return <div style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center' }}>Consultation not found</div>;

  const latestMetrics = (type: string) => {
    const m = (healthMetrics ?? []).filter((h: any) => h.metric_type === type);
    return m[0]?.value ?? null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Consultation</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          {consult.slot?.start_time ? format(new Date(consult.slot.start_time), 'EEEE, MMMM d · h:mm a') : '—'} with Dr. {consult.slot?.physician?.name ?? '—'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Patient info */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Patient</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { l: 'Name', v: consult.patient?.name },
              { l: 'Age', v: consult.patient?.age ? `${consult.patient.age} years` : null },
              { l: 'Gender', v: consult.patient?.gender },
              { l: 'Height', v: consult.patient?.height_cm ? `${consult.patient.height_cm} cm` : null },
              { l: 'Weight', v: consult.patient?.weight_kg ? `${consult.patient.weight_kg} kg` : null },
            ].map(({ l, v }) => v ? (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ) : null)}
            {consult.patient?.health_goals?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>Health Goals</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {consult.patient.health_goals.map((g: string) => (
                    <span key={g} style={{ background: 'var(--primary)22', color: 'var(--primary)', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Health snapshot */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Latest Health Data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '👟 Steps', type: 'steps', unit: '' },
              { label: '❤️ Heart Rate', type: 'heart_rate', unit: 'bpm' },
              { label: '😴 Sleep', type: 'sleep', unit: 'hrs' },
              { label: '🔥 Calories', type: 'calories', unit: 'kcal' },
            ].map(({ label, type, unit }) => {
              const v = latestMetrics(type);
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{v !== null ? `${type === 'sleep' ? Number(v).toFixed(1) : Math.round(Number(v))} ${unit}` : '—'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Video call */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Video Consultation</h3>
        {!inCall ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button label="🎥 Join Call (Agora)" onClick={() => setInCall(true)} />
            {consult.video_link && <Button label="Open Zoom Link" variant="outline" onClick={() => window.open(consult.video_link!, '_blank')} />}
            {!consult.video_link && <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Zoom link not configured</span>}
          </div>
        ) : (
          <div style={{ background: '#000', borderRadius: 12, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative' }}>
            <div style={{ fontSize: 48 }}>📹</div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Video call active — Channel: {consult.agora_channel ?? `consult-${id}`}</div>
            <div style={{ color: '#888', fontSize: 13 }}>Agora SDK integration active (native module required for production)</div>
            <div style={{ display: 'flex', gap: 12, position: 'absolute', bottom: 20 }}>
              <button onClick={() => setIsMuted(!isMuted)} style={{ background: isMuted ? '#FF4444' : '#2A2A2A', color: '#fff', border: 'none', borderRadius: '50%', width: 48, height: 48, fontSize: 20, cursor: 'pointer' }}>{isMuted ? '🔇' : '🎙️'}</button>
              <button onClick={() => setInCall(false)} style={{ background: '#FF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 48, height: 48, fontSize: 20, cursor: 'pointer' }}>📵</button>
            </div>
          </div>
        )}
      </Card>

      {/* Physician notes */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Consultation Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Enter consultation notes, observations, and treatment plan..."
          rows={6}
          style={{ resize: 'vertical', marginBottom: 12 }}
        />
        <Button label={saveNotes.isPending ? 'Saving...' : 'Save Notes'} onClick={() => saveNotes.mutate()} loading={saveNotes.isPending} />
      </Card>
    </div>
  );
}
