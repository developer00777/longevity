import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { format } from 'date-fns';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('uuid', id!).single();
      return data;
    },
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['patient-health-admin', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('uuid', id!)
        .order('recorded_at', { ascending: false })
        .limit(120);
      return data ?? [];
    },
  });

  const { data: consultations } = useQuery({
    queryKey: ['patient-consultations', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('consultations')
        .select('*, slot:consultation_slots(start_time, physician:physicians(name))')
        .eq('patient_uuid', id!)
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const latestByType = (type: string) => {
    const m = (healthMetrics ?? []).filter((h: any) => h.metric_type === type);
    return m[0]?.value ?? null;
  };

  const avgByType = (type: string) => {
    const m = (healthMetrics ?? []).filter((h: any) => h.metric_type === type);
    if (!m.length) return null;
    return Math.round(m.reduce((s: number, h: any) => s + h.value, 0) / m.length);
  };

  if (loadingPatient) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>;
  if (!patient) return <div style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center' }}>Patient not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 600, fontSize: 15, padding: 0, border: 'none' }}>← Back</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#000', flexShrink: 0 }}>
          {patient.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{patient.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {patient.age ? `${patient.age} yrs` : ''}
            {patient.gender ? ` · ${patient.gender}` : ''}
            {patient.height_cm ? ` · ${patient.height_cm} cm` : ''}
            {patient.weight_kg ? ` · ${patient.weight_kg} kg` : ''}
          </p>
          {patient.health_goals?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {patient.health_goals.map((g: string) => (
                <span key={g} style={{ background: 'var(--primary)22', color: 'var(--primary)', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health metrics grid */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Health Metrics (Last 30 Days)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: '👟 Steps', type: 'steps', unit: '/day', color: '#4CAF50' },
            { label: '❤️ Heart Rate', type: 'heart_rate', unit: 'bpm', color: '#F44336' },
            { label: '😴 Sleep', type: 'sleep', unit: 'hrs', color: '#9C27B0' },
            { label: '🔥 Calories', type: 'calories', unit: 'kcal', color: '#FF9800' },
          ].map(({ label, type, unit, color }) => {
            const latest = latestByType(type);
            const avg = avgByType(type);
            return (
              <div key={type} style={{ background: 'var(--surface-elevated)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{latest !== null ? (type === 'sleep' ? Number(latest).toFixed(1) : Math.round(Number(latest))) : '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
                {avg !== null && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>30d avg: {avg}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Consultation history */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Consultation History</h3>
        {!consultations?.length ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No consultations yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {consultations.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {(c.slot as any)?.physician?.name ?? '—'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {(c.slot as any)?.start_time ? format(new Date((c.slot as any).start_time), 'MMM d, yyyy · h:mm a') : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge status={c.status} />
                  <Button label="View" variant="outline" onClick={() => navigate(`/consult/${c.id}`)} style={{ height: 32, padding: '0 12px', fontSize: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
