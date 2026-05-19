import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function TherapiesAdminPage() {
  const queryClient = useQueryClient();

  const { data: therapies, isLoading } = useQuery({
    queryKey: ['admin-therapies'],
    queryFn: async () => { const { data } = await supabase.from('therapies').select('*').order('name'); return data ?? []; },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('therapies').update({ active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-therapies'] }),
  });

  const ICONS: Record<string, string> = {
    'Red Light Therapy': '💡', 'Cryotherapy': '❄️', 'Neuro Relaxation': '🧠',
    'Aromatherapy & Sound Healing': '🎵', 'Breathwork & Yoga': '🧘',
    'IV Nutrition / Longevity Drip': '💉', 'Hyperbaric Oxygen Chamber': '🫧',
    'Ice Bath / Cold Plunge / Steam': '🧊', 'Physiotherapy': '🦴',
    'Diet Therapy Consultation': '🥗', 'Cognitive Therapy': '🧩',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Therapy Catalog</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage available therapies</p>
      </div>

      {isLoading && <Spinner />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {therapies?.map((t: any) => (
          <Card key={t.id} style={{ opacity: t.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{ICONS[t.name] ?? '⚡'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 2 }}>
                  {t.pricing_tier === 'membership' ? '✅ Included' : '➕ Add-on'} · {t.duration_min} min
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{t.description}</p>
            <Button
              label={t.active ? 'Deactivate' : 'Activate'}
              variant={t.active ? 'danger' : 'outline'}
              onClick={() => toggleActive.mutate({ id: t.id, active: !t.active })}
              style={{ width: '100%' }}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
